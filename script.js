const SHOP_ID = "YOUR_SHOP_ID";
const BACKEND = "https://printify-backend-400k.onrender.com";


// ---------------- LOAD PRODUCTS ----------------
async function loadProducts() {
  const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json`, {
    headers: { "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImZiOTE1YjI4MWU0ZjViNDFhOGE2ZGY5YzIyZDJmMGIzZTZiOTlmN2IwNDc4MGNiZDU5MDZjN2Q5ZDg4NTUzMDk3ZjczOGFlYjYyZDEzOTBiIiwiaWF0IjoxNzY1Mjc2ODE2Ljg1MTQzOCwibmJmIjoxNzY1Mjc2ODE2Ljg1MTQ0LCJleHAiOjE3OTY4MTI4MTYuODQzNDM4LCJzdWIiOiIyNTI4MTEyOSIsInNjb3BlcyI6WyJzaG9wcy5tYW5hZ2UiLCJzaG9wcy5yZWFkIiwiY2F0YWxvZy5yZWFkIiwib3JkZXJzLnJlYWQiLCJvcmRlcnMud3JpdGUiLCJwcm9kdWN0cy5yZWFkIiwicHJvZHVjdHMud3JpdGUiLCJ3ZWJob29rcy5yZWFkIiwid2ViaG9va3Mud3JpdGUiLCJ1cGxvYWRzLnJlYWQiLCJ1cGxvYWRzLndyaXRlIiwicHJpbnRfcHJvdmlkZXJzLnJlYWQiLCJ1c2VyLmluZm8iXX0.a_88KPBXbEc4gdz9xyKKAyVmHn2gvP8reAWYQ019tNTOwajNddKmuic8wIKdBques_f_yWskrY1JQcyYCew59xXJ3VEnfjmYz5BqvXSbVp1csrFXRVp7YwmKqN46FdU5_K8cVLlGHLH44sRLMjfIzfaUI1B8JatBHRy3Mv-IUTzYBKe7envO8T2rbEcCctGvDEZuCl3VNtjl4p781MndrvYrHTHkwLoBr9t-8dfVq16cGvIkhUS0VvyovcGODRd3KYeKEbb75UIo0QCETrR5W_55352_XPB-E0lhUa26jju2CevaD7Gn-N6FS59J3fEOBDxLhfJ4inMfP9v7lI5hsFLg8m_XsSCa8GFVZgccUoQd4I-9VigwRs0UufHmAb45D8vKI-DhELuzqnL6_mR-TDfiVOj7L_L2__PViYh6rC-oEtEbGWUWL_suJVQbtiiJ9SQymbofx6YYHku3h95wT8S4aLSJo8kX0NogyAz3JBBPlfBsDaB7co29lh2Ugrr-YFvxSLhekzHZjUTgq83l45QjNOfhhE8nrJPCLRH8hjFbZBZZ7wNSY2nejLuko8r0ROJFvt61cNZYxKGmRxugtJiFLbCI94MSpWnD6fDDdRWKGLnYpcfvmEMUoTcHbK4bkAaNwpPkFfFW1enzTjXwJkgo2_B1v7YD5sJXuCJCibQ" }
  });
  const data = await res.json();

  const container = document.getElementById("products");

  data.data.forEach(p => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${p.images[0]}" width="100%">
        <h3>${p.title}</h3>
        <a class="btn" href="product.html?id=${p.id}">View</a>
      </div>
    `;
  });
}


// ---------------- SINGLE PRODUCT PAGE ----------------
async function loadSingleProduct() {
  const id = new URLSearchParams(window.location.search).get("id");

  const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products/${id}.json`, {
    headers: { "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImZiOTE1YjI4MWU0ZjViNDFhOGE2ZGY5YzIyZDJmMGIzZTZiOTlmN2IwNDc4MGNiZDU5MDZjN2Q5ZDg4NTUzMDk3ZjczOGFlYjYyZDEzOTBiIiwiaWF0IjoxNzY1Mjc2ODE2Ljg1MTQzOCwibmJmIjoxNzY1Mjc2ODE2Ljg1MTQ0LCJleHAiOjE3OTY4MTI4MTYuODQzNDM4LCJzdWIiOiIyNTI4MTEyOSIsInNjb3BlcyI6WyJzaG9wcy5tYW5hZ2UiLCJzaG9wcy5yZWFkIiwiY2F0YWxvZy5yZWFkIiwib3JkZXJzLnJlYWQiLCJvcmRlcnMud3JpdGUiLCJwcm9kdWN0cy5yZWFkIiwicHJvZHVjdHMud3JpdGUiLCJ3ZWJob29rcy5yZWFkIiwid2ViaG9va3Mud3JpdGUiLCJ1cGxvYWRzLnJlYWQiLCJ1cGxvYWRzLndyaXRlIiwicHJpbnRfcHJvdmlkZXJzLnJlYWQiLCJ1c2VyLmluZm8iXX0.a_88KPBXbEc4gdz9xyKKAyVmHn2gvP8reAWYQ019tNTOwajNddKmuic8wIKdBques_f_yWskrY1JQcyYCew59xXJ3VEnfjmYz5BqvXSbVp1csrFXRVp7YwmKqN46FdU5_K8cVLlGHLH44sRLMjfIzfaUI1B8JatBHRy3Mv-IUTzYBKe7envO8T2rbEcCctGvDEZuCl3VNtjl4p781MndrvYrHTHkwLoBr9t-8dfVq16cGvIkhUS0VvyovcGODRd3KYeKEbb75UIo0QCETrR5W_55352_XPB-E0lhUa26jju2CevaD7Gn-N6FS59J3fEOBDxLhfJ4inMfP9v7lI5hsFLg8m_XsSCa8GFVZgccUoQd4I-9VigwRs0UufHmAb45D8vKI-DhELuzqnL6_mR-TDfiVOj7L_L2__PViYh6rC-oEtEbGWUWL_suJVQbtiiJ9SQymbofx6YYHku3h95wT8S4aLSJo8kX0NogyAz3JBBPlfBsDaB7co29lh2Ugrr-YFvxSLhekzHZjUTgq83l45QjNOfhhE8nrJPCLRH8hjFbZBZZ7wNSY2nejLuko8r0ROJFvt61cNZYxKGmRxugtJiFLbCI94MSpWnD6fDDdRWKGLnYpcfvmEMUoTcHbK4bkAaNwpPkFfFW1enzTjXwJkgo2_B1v7YD5sJXuCJCibQ" }
  });

  const p = await res.json();

  document.getElementById("product-details").innerHTML = `
    <h1>${p.title}</h1>
    <img src="${p.images[0]}" width="300">
    <p>${p.description}</p>

    <button class="btn" onclick="goCheckout('${p.id}', '${p.variants[0].id}')">
      Buy Now
    </button>
  `;
}

function goCheckout(product_id, variant_id) {
  localStorage.setItem("product_id", product_id);
  localStorage.setItem("variant_id", variant_id);
  window.location.href = "checkout.html";
}


// ---------------- CHECKOUT → SEND ORDER ----------------
function checkout() {
  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const order = {
      line_items: [{
        product_id: localStorage.getItem("product_id"),
        variant_id: localStorage.getItem("variant_id"),
        quantity: 1
      }],
      address_to: {
        name: e.target.name.value,
        address1: e.target.address.value,
        city: e.target.city.value,
        country: "KE",
        email: e.target.email.value
      }
    };

    const res = await fetch(`${BACKEND}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await res.json();
    alert("Order Sent Successfully!");
    console.log(data);
  });
}
