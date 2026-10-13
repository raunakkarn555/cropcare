
import argparse
import csv
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import SessionLocal
from app.models.mandi_price import MandiPrice


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CSV = BASE_DIR / "data" / "mandi_prices.csv"

REQUIRED_COLUMNS = {
    "state",
    "district",
    "market",
    "commodity",
    "variety",
    "arrival_date",
    "min_price",
    "max_price",
    "modal_price",
}

TEXT_LIMITS = {
    "state": 100,
    "district": 100,
    "market": 150,
    "commodity": 100,
    "variety": 100,
}

UNIQUE_COLUMNS = [
    "state",
    "district",
    "market",
    "commodity",
    "variety",
    "arrival_date",
]


def clean_text(value, field):
    value = (value or "").strip()

    if not value:
        raise ValueError(f"{field} cannot be empty")

    if len(value) > TEXT_LIMITS[field]:
        raise ValueError(f"{field} is too long")

    return " ".join(value.split())


def parse_price(value, field):
    try:
        price = Decimal(str(value).strip())
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f"Invalid {field}: {value}")

    if not price.is_finite():
        raise ValueError(f"{field} must be finite")

    if price < 0:
        raise ValueError(f"{field} cannot be negative")

    if price.as_tuple().exponent < -2:
        raise ValueError(
            f"{field} cannot have more than 2 decimal places"
        )

    if price >= Decimal("10000000000"):
        raise ValueError(f"{field} exceeds database limit")

    return price


def validate_row(row):
    record = {}

    for field in TEXT_LIMITS:
        record[field] = clean_text(row.get(field), field)

    try:
        record["arrival_date"] = datetime.strptime(
            (row.get("arrival_date") or "").strip(),
            "%Y-%m-%d",
        ).date()
    except ValueError:
        raise ValueError(
            "arrival_date must use YYYY-MM-DD"
        )

    for field in (
        "min_price",
        "max_price",
        "modal_price",
    ):
        record[field] = parse_price(
            row.get(field),
            field,
        )

    if record["min_price"] > record["max_price"]:
        raise ValueError(
            "min_price cannot exceed max_price"
        )

    if not (
        record["min_price"]
        <= record["modal_price"]
        <= record["max_price"]
    ):
        raise ValueError(
            "modal_price must be between min and max"
        )

    return record


def import_csv(csv_path):
    csv_path = Path(csv_path)

    if not csv_path.is_file():
        raise FileNotFoundError(
            f"CSV file not found: {csv_path}"
        )

    inserted = 0
    updated = 0
    rejected = 0

    db = SessionLocal()

    try:
        with csv_path.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:

            reader = csv.DictReader(file)

            if reader.fieldnames is None:
                raise ValueError("CSV file is empty")

            columns = {
                col.strip()
                for col in reader.fieldnames
                if col is not None
            }

            missing = REQUIRED_COLUMNS - columns

            if missing:
                raise ValueError(
                    f"Missing CSV columns: {sorted(missing)}"
                )

            for row_number, row in enumerate(
                reader,
                start=2,
            ):
                try:
                    record = validate_row(row)

                    # Check whether the record already exists.
                    existing_id = db.scalar(
                        select(MandiPrice.id).where(
                            *[
                                getattr(MandiPrice, col)
                                == record[col]
                                for col in UNIQUE_COLUMNS
                            ]
                        )
                    )

                    # PostgreSQL UPSERT:
                    # insert a new record or update prices.
                    stmt = insert(MandiPrice).values(
                        **record
                    )

                    stmt = stmt.on_conflict_do_update(
                        constraint="uq_mandi_price_record",
                        set_={
                            "min_price": stmt.excluded.min_price,
                            "max_price": stmt.excluded.max_price,
                            "modal_price": stmt.excluded.modal_price,
                        },
                    )

                    # Each row is committed independently so a
                    # failed row does not invalidate prior rows.
                    db.execute(stmt)
                    db.commit()

                    if existing_id is None:
                        inserted += 1
                    else:
                        updated += 1

                except (ValueError, TypeError) as error:
                    db.rollback()
                    rejected += 1
                    print(
                        f"Row {row_number} rejected: {error}"
                    )

                except Exception:
                    db.rollback()
                    raise

    finally:
        db.close()

    print("\n--- IMPORT SUMMARY ---")
    print(f"Inserted: {inserted}")
    print(f"Updated:  {updated}")
    print(f"Rejected: {rejected}")
    print(f"Total:    {inserted + updated + rejected}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Import mandi prices from CSV"
    )

    parser.add_argument(
        "--file",
        type=Path,
        default=DEFAULT_CSV,
        help="Path to mandi price CSV file",
    )

    args = parser.parse_args()

    import_csv(args.file)
