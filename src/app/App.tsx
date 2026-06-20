import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { SettingsProvider } from "./context/SettingsContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <SettingsProvider>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </SettingsProvider>
  );
}