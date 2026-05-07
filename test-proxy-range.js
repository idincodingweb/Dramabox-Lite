import axios from 'axios';

async function test() {
  try {
    const url = "http://localhost:3000/api/proxy-video?url=" + encodeURIComponent("https://hwztakavideo.dramaboxdb.com/78a8de9d813706a20c5465f33f709172/69f69000/35/6x3/63x9/639x3/63930000024/700247453_1/700247453.1080p.wz.g264.mp4");
    const res = await axios.get(url, { headers: { 'Range': 'bytes=0-1000' }});
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
    } else {
      console.log("Error:", err.message);
    }
  }
}
test();
