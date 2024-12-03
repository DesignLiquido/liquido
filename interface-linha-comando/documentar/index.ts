import { AutoDocumentador } from "../../infraestrutura/auto-documentacao/auto-documentador";

export async function documentar() {
    // TODO: Terminar após finalizar auto-documentador.
    const autoDocumentador = new AutoDocumentador();
    await autoDocumentador.documentar();
}
