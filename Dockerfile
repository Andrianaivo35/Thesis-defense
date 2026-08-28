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

EXPOSE 3000

CMD ["npm", "start"]
