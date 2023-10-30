# !pip install openpyxl

import openpyxl
import json

def read_excel_to_json(excel_file_path):
    workbook = openpyxl.load_workbook(excel_file_path)
    sheet = workbook.active

    data = []
    headers = [cell.value for cell in sheet[1]]

    for row in sheet.iter_rows(min_row=2):
        row_data = {}
        for header, cell in zip(headers, row):
            row_data[header] = cell.value
        data.append(row_data)

    return json.dumps(data)

# if __name__ == "__main__":
#     # You can test your function here
#     excel_file_path = "../public/uploads/questions/excel/questionSet-169868629644142539.xlsx"
#     result = read_excel_to_json(excel_file_path)
#     print(result)
