document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".buscadorcab");
  const resultados = document.getElementById("resultados");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const tipo = form.tipo.value;
    const cod = form.cod.value;
    const barrio = document.getElementById("campobusq").value.toLowerCase();
    const operacion = form.querySelector('input[name="ope"]').value;

    // 🔍 Ver qué filtros se están enviando
    console.log("Filtros enviados:", { tipo, cod, barrio, operacion });



    fetch("propiedades.json")
      .then(res => res.json())
      .then(data => {
        const filtradas = data.filter(p =>
          (!tipo || p.tipo === tipo) &&
          (!cod || p.codigo == cod) &&
          (!barrio || p.barrio.toLowerCase().includes(barrio)) &&
          (!operacion || p.operacion === operacion)
        );
        // 🔍 Ver qué propiedades pasaron el filtro
        console.log("Propiedades filtradas:", filtradas);


        
        resultados.innerHTML = "";

        if (filtradas.length === 0) {
          resultados.innerHTML = "<p>No se encontraron propiedades que coincidan con su búsqueda.</p>";
          return;
        }       
        
        filtradas.forEach(prop => {
          const card = document.createElement("div");
          card.className = "propiedad";
          card.innerHTML = `
            <h3>${prop.titulo}</h3>
            <p><strong>Barrio:</strong> ${prop.barrio}</p>
            <p><strong>Precio:</strong> $${prop.precio}</p>
            <p><strong>Ambientes:</strong> ${prop.ambientes}</p>
            <p><strong>Metros:</strong> ${prop.metros} m²</p>
            <p><strong>Operación:</strong> ${prop.operacion}</p>
            <p><strong>Tipo:</strong> ${prop.tipo}</p>
            <p><strong>Descripción:</strong> ${prop.descripcion}</p>
          `;
          resultados.appendChild(card);
        });
      });
  });
});