import { estruturarCurriculo, textoSeguroParaPdf } from "@/lib/estrutura-curriculo";
import { nomeArquivoPdf } from "@/lib/slug";

const MARGEM_2CM = 56.69; // 2 cm em pontos

/**
 * Gera o PDF no navegador com @react-pdf/renderer.
 * Uma coluna, Helvetica, texto selecionável, sem cores, ícones ou tabelas.
 */
export async function baixarPdf(curriculo: string, cargo: string): Promise<void> {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");

  const estilos = StyleSheet.create({
    pagina: {
      paddingTop: MARGEM_2CM,
      paddingBottom: MARGEM_2CM,
      paddingLeft: MARGEM_2CM,
      paddingRight: MARGEM_2CM,
      fontFamily: "Helvetica",
      fontSize: 10.5,
      lineHeight: 1.4,
      color: "#000000",
    },
    nome: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
    contato: { fontSize: 10 },
    titulo: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 10, marginBottom: 4 },
    topico: { flexDirection: "row", marginBottom: 1 },
    marcador: { width: 10 },
    textoTopico: { flex: 1 },
    paragrafo: { marginBottom: 1 },
    espaco: { height: 4 },
  });

  const blocos = estruturarCurriculo(textoSeguroParaPdf(curriculo));

  const documento = (
    <Document title={`Currículo - ${cargo}`} language="pt-BR" creator="Encaixe" producer="Encaixe">
      <Page size="A4" style={estilos.pagina}>
        {blocos.map((b, i) => {
          switch (b.tipo) {
            case "nome":
              return <Text key={i} style={estilos.nome}>{b.texto.toUpperCase()}</Text>;
            case "contato":
              return <Text key={i} style={estilos.contato}>{b.texto}</Text>;
            case "titulo":
              return <Text key={i} style={estilos.titulo} minPresenceAhead={30}>{b.texto}</Text>;
            case "topico":
              return (
                <View key={i} style={estilos.topico} wrap={false}>
                  <Text style={estilos.marcador}>-</Text>
                  <Text style={estilos.textoTopico}>{b.texto}</Text>
                </View>
              );
            case "paragrafo":
              return <Text key={i} style={estilos.paragrafo}>{b.texto}</Text>;
            default:
              return <View key={i} style={estilos.espaco} />;
          }
        })}
      </Page>
    </Document>
  );

  const blob = await pdf(documento).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoPdf(cargo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
