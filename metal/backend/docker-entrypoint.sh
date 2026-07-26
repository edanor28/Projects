set -e

echo "🔒 Verificando y aplicando migraciones pendientes..."
npx prisma migrate deploy

echo "🚀 Iniciando aplicación..."
exec node dist/main