import axios from 'axios';

async function test() {
  try {
    const list = await axios.get("https://raw.githubusercontent.com/idincodingweb/DracinApiByIdinCode/main/List%20Data/ListDataByIdinCode.json");
    
    // Find "Di Balik Dinding Kematian"
    const item = list.data.find(d => d.bookName && d.bookName.includes("Di Balik"));
    if (!item) {
        console.log("Not found!"); return;
    }
    console.log("Book found:", item.bookId, item.bookName);
    
    const epRes = await axios.get(`https://raw.githubusercontent.com/idincodingweb/DracinApiByIdinCode/main/Raw%20Episode/raw_episodes_${item.bookId}.json`);
    const epData = epRes.data;
    const ep1 = epData[0];
    const cdn = ep1.cdnList[0];
    console.log(JSON.stringify(cdn.videoPathList, null, 2));

  } catch (err) {
    console.error(err.message);
  }
}
test();
