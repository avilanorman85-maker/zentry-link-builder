import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
export const Route = createFileRoute("/app/builder/")({
  component: () => {
    const nav = useNavigate();
    useEffect(() => { nav({ to: "/app/builder/$id", params: { id: "new" }, replace: true }); }, [nav]);
    return null;
  },
});
