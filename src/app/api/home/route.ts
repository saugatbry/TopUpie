import { hianime } from "@/lib/hianime";
import { aniverse } from "@/lib/aniverse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "subdub";
    const data = provider === "hindi"
      ? await aniverse.getHomePage()
      : await hianime.getHomePage();
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
