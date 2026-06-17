import { PlateView } from "@/components/PlateView";

export default function PlatePage({ params }: { params: { id: string } }) {
  return <PlateView plateId={params.id} />;
}
