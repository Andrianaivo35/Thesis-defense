FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET
RUN npm run build

# Fichiers televerses : hors de public/, monte sur un volume en execution
ENV UPLOADS_DIR=/app/uploads
RUN mkdir -p /app/uploads/cv /app/uploads/lettres

# Donnees linguistiques de l'OCR. Elles sont versionnees dans le depot et
# copiees dans l'image plutot que telechargees au premier appel : sans
# cela, la premiere analyse d'un CV scanne echoue des que la machine est
# hors ligne. Une soutenance se deroule rarement avec un reseau fiable.
ENV OCR_DATA_DIR=/app/ocr-data
ENV MOTEUR_OCR=tesseract

EXPOSE 3000

CMD ["npm", "start"]
