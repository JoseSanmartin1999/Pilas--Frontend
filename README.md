# Pilas! - Frontend

Este repositorio contiene la aplicación cliente (interfaz de usuario) para **Pilas!**, la plataforma de tutorías académicas de la ESPE. Está desarrollado en React utilizando Vite, Tailwind CSS y Redux Toolkit.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado:
* **Node.js** (versión 18 o superior recomendada)
* **npm**

---

## ⚙️ Configuración del Proyecto

### 1. Instalar dependencias
Desde la raíz de la carpeta `Pilas--Frontend`, ejecuta:
```bash
npm install
```

### 2. Configurar la URL de la API del Backend
Asegúrate de configurar la URL del backend a la que apuntará la aplicación cliente. 
Abre el archivo [constants.json](file:///c:/Users/VICTUS/Documents/ConstruccionyEvo/Pilas!/Pilas--Frontend/src/config/constants.json) y define la variable `API_URL` según corresponda:
```json
{
  "API_URL": "http://localhost:3000",
  ...
}
```

---

## 🚀 Comandos Disponibles

### Modo Desarrollo (Vite dev server)
Inicia la aplicación localmente en modo de desarrollo con recarga rápida (HMR):
```bash
npm run dev
```
La aplicación estará disponible típicamente en `http://localhost:5173`.

### Compilación para Producción (Build)
Compila y optimiza la aplicación para producción en la carpeta `dist/`:
```bash
npm run build
```

### Vista Previa de Producción (Preview)
Levanta un servidor web local para visualizar el build de producción generado:
```bash
npm run preview
```

### Linter (ESLint)
Ejecuta el chequeo de calidad y formato del código:
```bash
npm run lint
```
