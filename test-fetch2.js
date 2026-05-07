import axios from 'axios';

async function test() {
  try {
    const url = "https://hwztvideo.dramaboxdb.com/41/3x3/33x8/338x9/33891100014/598400214_1/598400214.720p.narrowv3.mp4?Expires=1777766400&Signature=NOiHzWE1T8yxwMydSY1vi0YWb-lffiDPmDFa4LzG0Af6zngGx6RdGGn3KLiGCJq-0mPAJpGc7kJvb-~yTPl4BT1vHdrEydNvrBJMgUNc4naNeC5a~qO4jGnG~KM5hBjpmIShnnAf5cznvucprYWmvX3W-q94IIfHII~-VO8ZSPvU5jo7nZuItSt3LB9ymgz9QsOr1R9P~X5isg01ofL~iTQOs6Si1RCRnrCoXm-MMProBklytBTO5Ydvcx1XKfnMjlY0QM154CwaXVt1NlUfur1fNoRgZFnblgHgCDouj6TjYed~9gHxJNEdtMMaOa4bGDZkMwGzaaPSgtiVBxBWrg__&Key-Pair-Id=K3HA2TLE2QH99V";
    const res = await axios.head(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://dramaboxdb.com/",
        "Origin": "https://dramaboxdb.com",
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error message:", err.response.statusText);
    } else {
      console.log("Error:", err.message);
    }
  }
}
test();
