# Loan Default Studio: FastAPI backend + built dashboard (Railway / Render / any Docker host)
FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /app
COPY deploy/space/requirements.txt requirements-api.txt
RUN pip install --no-cache-dir -r requirements-api.txt
COPY api api
COPY studio/dist studio/dist
COPY studio/public/snapshot.json studio/public/snapshot.json
COPY data/raw/Loan_default.csv data/raw/Loan_default.csv
COPY data_warehouse/loan_dw.db data_warehouse/loan_dw.db
COPY prediction/saved_models prediction/saved_models
COPY preprocessing/loader.py preprocessing/loader.py
EXPOSE 8000
CMD ["python", "api/main.py"]
