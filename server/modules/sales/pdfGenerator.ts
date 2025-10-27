import type { DealDocument } from "@shared/schema";

export function generateSimplePDF(document: DealDocument): string {
  const data = typeof document.data === 'string' ? JSON.parse(document.data) : document.data;
  const positions = data?.positions || [];

  const totalAmount = positions.reduce((sum: number, pos: any) => {
    return sum + (pos.price * pos.quantity);
  }, 0);

  const docTypeNames: Record<string, string> = {
    'quote': 'Коммерческое предложение',
    'invoice': 'Счет на оплату',
    'contract': 'Договор'
  };

  const docTypeName = docTypeNames[document.document_type] || 'Документ';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    .document-info {
      margin: 20px 0;
      background: #f3f4f6;
      padding: 15px;
      border-radius: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background-color: #2563eb;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .item-image {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      text-align: right;
      margin-top: 20px;
      color: #2563eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${docTypeName}</h1>

  <div class="document-info">
    <p><strong>Название:</strong> ${document.name}</p>
    <p><strong>Версия:</strong> ${document.version || 1}</p>
    <p><strong>Дата создания:</strong> ${new Date(document.created_at).toLocaleDateString('ru-RU')}</p>
    ${document.is_signed ? '<p><strong>Статус:</strong> ✓ Подписан</p>' : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>№</th>
        <th>Фото</th>
        <th>Наименование</th>
        <th>Цена</th>
        <th>Количество</th>
        <th>Сумма</th>
      </tr>
    </thead>
    <tbody>
`;

  positions.forEach((pos: any, index: number) => {
    const total = pos.price * pos.quantity;
    const imageCell = pos.imageUrl
      ? `<img src="${pos.imageUrl}" alt="Фото" class="item-image" />`
      : '—';

    html += `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align: center;">${imageCell}</td>
        <td>${pos.name}</td>
        <td>${pos.price.toLocaleString('ru-RU')} ₽</td>
        <td>${pos.quantity}</td>
        <td>${total.toLocaleString('ru-RU')} ₽</td>
      </tr>
    `;
  });

  html += `
    </tbody>
  </table>

  <div class="total">
    Итого: ${totalAmount.toLocaleString('ru-RU')} ₽
  </div>

  <div class="footer">
    <p>Документ сгенерирован автоматически ${new Date().toLocaleString('ru-RU')}</p>
  </div>
</body>
</html>
`;

  return html;
}
