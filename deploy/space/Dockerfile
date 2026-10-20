# Loan Default Studio: FastAPI backend + built dashboard, for a Hugging Face Docker Space
FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PORT=7860
RUN useradd -m -u 1000 user
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=user . .
USER user
EXPOSE 7860
CMD ["python", "api/main.py"]
