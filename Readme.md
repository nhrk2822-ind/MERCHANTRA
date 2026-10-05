# MERCHANTRA login redesign: kaise lagana hai

Ye files aapke EXISTING React + Vite project me daalni hain. Backend, API, JWT, routes ko haath nahi lagana.

## 1. Files copy karo

```
src/styles/theme.css
src/components/MerchantraLogo.jsx
src/components/FloatingBackground.jsx
src/pages/Login.jsx
src/pages/Login.css
```

Agar aapke project me `Login.jsx` pehle se hai, to uska purana auth code (API call, token save, redirect) kahin copy karke rakh lo, kyunki wahi `onLogin` me jayega.

## 2. Theme ek baar import karo

`src/main.jsx` me:

```jsx
import "./styles/theme.css";
```

Purani blue-purple CSS (global gradient, purple variables) hata do ya override kar do.

## 3. Apna EXISTING auth call `onLogin` me jodo

`Login` component ko ek function chahiye jo email/password leke sign-in kare aur fail hone par `Error` throw kare. Example (apne real endpoint, token key aur redirect se replace karo):

```jsx
import { useNavigate } from "react-router-dom";
import Login from "./pages/Login";
// import { loginRequest } from "./api/auth";   // <- aapka existing function

function LoginRoute() {
  const navigate = useNavigate();

  async function handleLogin({ email, password }) {
    // YAHAN apna existing code lagao:
    // const data = await loginRequest(email, password);
    // localStorage.setItem("<aapki existing token key>", data.token);
    // navigate("<aapka existing dashboard route>");
  }

  return <Login onLogin={handleLogin} />;
}
```

Register / forgot-password links tabhi dikhte hain jab aap `registerHref` ya `forgotHref` pass karo. Agar app me wo pages nahi hain, to pass mat karo.

## 4. Run

```
npm install      # sirf pehli baar
npm run dev      # http://localhost:5173
npm run build    # build check
```

## 5. Test checklist

- Khali submit -> email/password ke error dikhne chahiye
- Galat password -> backend ka error message dikhe
- Sahi login -> wahi redirect jo pehle tha
- Eye icon se password show/hide
- Tab key se saare controls pe focus ring dikhe
- Browser ko phone size me karo -> kam logos, form saaf
- OS me "reduce motion" on karo -> logos ruk jane chahiye

## 6. Baaki app me theme

`theme.css` me ready classes hain: `.mt-btn`, `.mt-btn--primary`, `.mt-input`, `.mt-nav`, `.mt-card`, `.mt-table`, `.mt-badge--success/info/warn/danger`, `.mt-modal`. Existing pages ke buttons, tables, modals pe ye classes lagao, ya CSS me `var(--mt-teal)` jaise variables use karo.

## Dhyan rakhne wali baatein

- Floating logos abhi **text tiles** hain (brand colour me). Official Amazon/Flipkart/Meesho/Myntra logo files tabhi lagao jab aapke paas unhe use karne ki permission ho. `FloatingBackground.jsx` me `img: "/brands/amazon.svg"` jaisa field de do.
- MERCHANTRA logo ka M maine SVG se recreate kiya hai. Agar aapke paas original logo file hai, to `MerchantraLogo.jsx` me `<svg>` ki jagah `<img>` laga do.
- Maine code run ya build nahi kiya, kyunki mere paas aapka project nahi hai. Pehle `npm run build` chala ke dekh lena.