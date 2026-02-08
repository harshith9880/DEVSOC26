import pandas as pd

def load_data(path):
    df=pd.read_csv(path,low_memory=False)
    print("Rows:",df.shape[0])
    print("Columns:",df.shape[1])
    return df

if __name__=="__main__":
    df=load_data("data/raw/accepted_2007_to_2018Q4.csv")
    print(df.head())
