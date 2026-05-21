import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
Package dependencies check karo
package.json me ye dependencies honi chahiye:

{
  "dependencies": {
    "@supabase/supabase-js": "^2.99.1",
    "@tailwindcss/vite": "^4.2.1",
    "framer-motion": "^12.35.0",
    "lucide-react": "^0.577.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.2.1"
  }
}
