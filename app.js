const fetch = require('node-fetch');
const XLSX = require('xlsx');

let retry = 0;
const numberOfRetries = 10;
const retryInterval = 60000; //Number in miliseconds
const messages = [
  'Este processo pode demorar um pouco, talvez você queira pegar um café.',
  'Se não tiver um café pronto pode ir lá fazer, isso realmente demora.',
  'Consultando dados de aeroportos...',
  'Inicializando geração do arquivo.',
  'Processo finalizado com sucesso.'
];

loop("aaa");

async function loop(init) {
  let allAirports = [];
  let temp = init;
  let airport = await getAirportData(init);
  allAirports.push(airport);
  console.log(messages[0]);
  console.log(messages[1]);
  console.log(messages[2]);

  while (true) {
    temp = generate(temp);
    if (temp == init) break;
    airport = await getAirportData(temp);
    allAirports.push(airport);
  }
  generateXLS(allAirports);
}

function generate(str) {
  let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  let chars = [];
  for (let i = 0; i < str.length; i++) {
    chars.push(alphabet.indexOf(str[i]));
  }
  for (let i = chars.length - 1; i >= 0; i--) {
    let tmp = chars[i];
    if (tmp >= 0 && tmp < alphabet.length - 1) {
      chars[i]++;
      break;
    } else {
      chars[i] = 0;
    }
  }
  let newstr = "";
  for (let i = 0; i < chars.length; i++) {
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
    if(retry < numberOfRetries){
      retry++;
      setTimeout(() => {
        return getAirportData(airport);
      }, retryInterval);
    }
    console.error(error);
  }
}
async function generateXLS(data) {
  console.log(messages[3]);
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
    console.log(messages[3]);
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
