const fetch = require('node-fetch');
const XLSX = require('xlsx');

let retry = 0;

loop("aaa");

async function loop(init) {
  let allAirports = [];
  var temp = init;
  let airport = await getAirportData(init);
  allAirports.push(airport);
  console.log('Este processo pode demorar um pouco, talvez você queira pegar um café.');
  console.log('Se não tiver um café pronto pode ir lá fazer, isso realmente demora.');
  console.log('Consultando dados de aeroportos...');
  while (true) {
    temp = generate(temp);
    if (temp == init) break;
    airport = await getAirportData(temp);
    allAirports.push(airport);
  }
  console.log(JSON.stringify(allAirports))
  generateXLS(allAirports);
}
function generate(str) {
  var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  var chars = [];
  for (var i = 0; i < str.length; i++) {
    chars.push(alphabet.indexOf(str[i]));
  }
  for (var i = chars.length - 1; i >= 0; i--) {
    var tmp = chars[i];
    if (tmp >= 0 && tmp < 25) {
      chars[i]++;
      break;
    } else {
      chars[i] = 0;
    }
  }
  var newstr = "";
  for (var i = 0; i < chars.length; i++) {
    newstr += alphabet[chars[i]];
  }
  return newstr;
}
async function getAirportData(airport) {
  try {
    const url = `https://www.decolar.com/suggestions?locale=pt-BR&profile=sbox-cp-vh&hint=${airport}&fields=city`;
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.log(`Ocorreu um erro ao consultar a API. Foi necessária ${retry + 1} retentativa.`);
    if(retry < 10){
      retry++;
      setTimeout(() => {
        return getAirportData(airport);
      }, 60000);
    }
    console.error(error);
  }
}
async function generateXLS(data) {
  console.log('Inicializando geração do arquivo.');
  const formatedAirports = formatedData2XLS(data);
  const headers = [
    ['id'],
    ['display']
  ];
  const lines = formatedAirports.map(item => Object.values(item));

  try {
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_json(ws, lines);
    XLSX.utils.book_append_sheet(wb, ws, "Airports");
    XLSX.writeFile(wb, 'airports.xls');
    console.log('Processo finalizado com sucesso.')
  } catch (error) {
    console.error(error);
  }
}
function formatedData2XLS(unformatted) {
  return unformatted.map(airport => {
    try {
      const formatted = airport.items[0].items[0];

      return { id: formatted.id, display: formatted.display }
    } catch (error) {
      return { id: '-', display: 'Dados não encontrados para este aeroporto.' }
    }
  });
}
