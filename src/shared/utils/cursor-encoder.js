// Utilidad para codificar cursor manualmente
const cursor = {
    "createdAt": "2025-08-19T18:37:49.794Z",
    "id": "67e94b28-9871-545a-be13-5acd46fc495c"
};

const encodedCursor = Buffer.from(JSON.stringify(cursor)).toString('base64');
console.log('Cursor codificado:', encodedCursor);
console.log('URL:', `{{base_url}}/listings?limit=10&cursor=${encodedCursor}`);