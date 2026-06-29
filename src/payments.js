// Generación de links de pago. Soporta 3 modos según PAYMENT_PROVIDER:
//   - "manual": devuelve un link fijo que tú pegaste en .env (lo más rápido para arrancar)
//   - "mercadopago": crea una preferencia de pago dinámica
//   - "stripe": crea un Payment Link dinámico
//
// Todos devuelven { url } para que el resto del bot no tenga que saber el "cómo".

const PROVIDER = process.env.PAYMENT_PROVIDER ?? "manual";
const PRECIO = Number(process.env.PRECIO_MEMBRESIA ?? 49900); // en centavos
const MONEDA = process.env.MONEDA ?? "MXN";

export async function crearLinkDePago({ concepto = "Membresía Sophion Club", phone } = {}) {
  switch (PROVIDER) {
    case "mercadopago":
      return crearLinkMercadoPago({ concepto });
    case "stripe":
      return crearLinkStripe({ concepto });
    case "manual":
    default:
      return { url: process.env.MANUAL_PAYMENT_LINK ?? "https://tu-link-de-pago.com" };
  }
}

async function crearLinkMercadoPago({ concepto }) {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: concepto,
          quantity: 1,
          unit_price: PRECIO / 100, // Mercado Pago usa unidades, no centavos
          currency_id: MONEDA,
        },
      ],
    }),
  });
  const data = await res.json();
  return { url: data.init_point };
}

async function crearLinkStripe({ concepto }) {
  // 1) Crear un precio efímero
  const priceRes = await fetch("https://api.stripe.com/v1/prices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      unit_amount: String(PRECIO),
      currency: MONEDA.toLowerCase(),
      "product_data[name]": concepto,
    }),
  });
  const price = await priceRes.json();

  // 2) Crear el Payment Link con ese precio
  const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": "1",
    }),
  });
  const link = await linkRes.json();
  return { url: link.url };
}
