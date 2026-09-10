FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Next.js fige les variables NEXT_PUBLIC_* au build, pas au démarrage.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["sh", "-c", "npm start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
