FROM node:20-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
ENV PORT=4000 UPLOAD_DIR=/tmp/third-eye-uploads
EXPOSE 4000
CMD ["node", "dist/index.js"]
