FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server main.go

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
USER 65532:65532
ENTRYPOINT ["/server"]
