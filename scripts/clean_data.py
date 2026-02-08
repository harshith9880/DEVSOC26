import pandas as pd


# ============================
# CONFIG
# ============================

RAW_PATH = "data/raw/accepted_2007_to_2018Q4.csv"
OUTPUT_PATH = "data/processed/cleaned.csv"

# Drop columns if missing > 80%
MISSING_THRESHOLD = 0.80


# ============================
# LOAD DATA
# ============================

def load_data(path):
    print("Loading data...")
    df = pd.read_csv(path, low_memory=False)
    print("Shape:", df.shape)
    return df


# ============================
# DROP HIGH-MISSING COLUMNS
# ============================

def drop_high_missing(df, threshold):

    print("\nChecking missing values...")

    missing_ratio = df.isnull().mean()

    drop_cols = missing_ratio[missing_ratio > threshold].index.tolist()

    print(f"Dropping {len(drop_cols)} columns (>{threshold*100}% missing)")

    if drop_cols:
        print("Dropped columns:")
        for col in drop_cols:
            print(" -", col)

    df = df.drop(columns=drop_cols)

    return df


# ============================
# HANDLE MISSING VALUES
# ============================

def fill_missing(df):

    print("\nFilling missing values...")

    # Numeric columns → median
    num_cols = df.select_dtypes(include=["int64","float64"]).columns

    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())


    # Categorical columns → "Unknown"
    cat_cols = df.select_dtypes(include=["object","string"]).columns


    for col in cat_cols:
        df[col] = df[col].fillna("Unknown")


    return df


# ============================
# FORMAT FIXING
# ============================

def fix_formats(df):

    print("\nFixing formats...")

    # Clean term
    if "term" in df.columns:
        df["term"] = (
            df["term"]
            .astype(str)
            .str.replace(" months","", regex=False)
        )
        df["term"] = pd.to_numeric(df["term"], errors="coerce")


    # Clean interest rate
    if "int_rate" in df.columns:
        df["int_rate"] = (
            df["int_rate"]
            .astype(str)
            .str.replace("%","", regex=False)
        )
        df["int_rate"] = pd.to_numeric(df["int_rate"], errors="coerce")


    return df



# ============================
# MAIN PIPELINE
# ============================

def main():
    df = load_data(RAW_PATH)

    df = drop_high_missing(df, MISSING_THRESHOLD)
    
    df = fix_formats(df)

    df = fill_missing(df)

    

    print("\nFinal Shape:", df.shape)

    print("\nSaving cleaned file...")

    df.to_csv(OUTPUT_PATH, index=False)

    print("Done!")
    print("Saved at:", OUTPUT_PATH)


# ============================
# RUN
# ============================

if __name__ == "__main__":
    main()
