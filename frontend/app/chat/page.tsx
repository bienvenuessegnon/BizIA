export default function ChatPage() {
  return (
    <section>
      <h1>Chat avec les données</h1>
      <p className="muted">
        Interface conversationnelle. Le moteur LLM / RAG vit dans le backend.
      </p>
      <div className="card">« Quelles sont mes meilleures ventes ? »</div>
      <div className="card">« Explique-moi cette anomalie. »</div>
      <div className="card">« Génère-moi un rapport. »</div>
    </section>
  );
}
