require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const MEGA = require('megajs');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const APP_PASSWORD = process.env.APP_PASSWORD;

app.use(bodyParser.urlencoded({ extended: true }));

let loggedIn = false;

// --- LOGIN PAGE: MEMORIES STYLE ---
app.get('/', (req, res) => {
  if (loggedIn) {
    res.redirect('/gallery');
  } else {
    res.send(`
      <style>
        body {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #f9f8f3 60%, #efe9db 100%);
          font-family: 'Poppins', sans-serif;
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .dev-badge {
          position: absolute;
          top: 40px; right: 45px;
          background: #bc9cff;
          color: #2d1747;
          font-weight: bold;
          border-radius: 10px;
          padding: 10px 28px 10px 18px;
          box-shadow: 0 2px 12px #c8a8ff44;
          font-size: 1.08em;
          text-align: left;
          line-height: 1.25;
        }
        .dev-badge span {
          font-weight: 400;
          font-size: 0.9em;
          display: block;
        }

        .login-center {
          margin: auto;
          text-align: center;
          margin-top: 10vh;
        }

        .memories-title {
          font-family: 'Pacifico', cursive, 'Poppins', sans-serif;
          font-size: 3.4em;
          color: #6e5a36;
          letter-spacing: 1px;
          margin-bottom: 7px;
        }

        .welcome-msg {
          font-size: 1.44em;
          margin-bottom: 24px;
          font-weight: 600;
          color: #222;
        }
        .purple-box {
          display: inline-block;
          background: #b792ec;
          color: #222;
          font-size: 1.1em;
          font-family: 'Poppins', sans-serif;
          padding: 18px 54px;
          border-radius: 13px;
          box-shadow: 0 1px 4px #d4dbff33;
          margin-top: 19px;
          font-weight: 500;
        }
        input[type=password] {
          padding:8px 20px;
          border-radius:7px;
          border:1.2px solid #a695cf;
          margin:12px 0;
          font-size:1.05em;
          background: #fbf7ff;
        }
        button {
          padding:7px 20px;
          border-radius:8px;
          border:none;
          background: #9e80e5;
          color: #fff;
          font-weight:600;
          font-size:1.05em;
          margin-left:9px;
          box-shadow:0 1px 12px #b792ec44;
          transition:.17s;
        }
        button:hover {
          background: #bc9cff;
          color: #4b2870;
        }
      </style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Pacifico:400&display=swap">
      <div class="dev-badge">
        Developed by :<br/>
        <span>Team 3tEch i</span>
      </div>
      <div class="login-center">
        <div class="memories-title">Memories!</div>
        <div class="welcome-msg">
          Welcome to your<br/>personal gallery sir!
        </div>
        <form method="post" action="/login">
          <div class="purple-box">
            <label for="pw">Enter your password!</label><br/>
            <input type="password" name="password" id="pw" required />
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
    `);
  }
});

// --- LOGIN HANDLER ---
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    loggedIn = true;
    res.redirect('/gallery');
  } else {
    res.send('Incorrect password. <a href="/">Try again</a>');
  }
});

// --- GALLERY PAGE WITH LIGHTBOX ---
app.get('/gallery', (req, res) => {
  if (!loggedIn) return res.redirect('/');

  let files = [];
  try { files = JSON.parse(fs.readFileSync('filedata.json')); } catch {}

  let html = `
  <div class="header-bar">
    <h1>My Memoreis!</h1>
    <a href="/logout" class="logout-btn">Logout</a>
  </div>
  <div class="upload-section">
    <h2>Upload New Photo</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" required class="file-input"/>
      <button class="upload-btn">Upload</button>
    </form>
  </div>
  <div class="gallery-wrapper">
    <h2>Your Gallery</h2>
    <div class="gallery-row">
  `;

  files.forEach((file, idx) => {
    if (idx % 4 === 0 && idx !== 0) html += `</div><div class="gallery-row">`;
    html += `
      <div class="gallery-cell">
        <div class="img-frame">
          <img src="/download/${encodeURIComponent(file.name)}"
            alt="${file.name}"
            class="photo-thumb"
            onclick="openLightbox('/download/${encodeURIComponent(file.name)}', '${file.name}')"
            style="cursor:pointer" />
        </div>
        <div class="photo-caption">${file.name}</div>
        <div class="btn-bar">
          <a href="/download/${encodeURIComponent(file.name)}" class="btn">Download</a>
          <a href="/delete/${encodeURIComponent(file.name)}"
            onclick="return confirm('Are you sure you want to delete this file?');"
            class="btn btn-delete">Delete</a>
        </div>
      </div>
    `;
  });
  html += '</div></div>';

  html += `
    <div id="lightbox-overlay" class="lightbox-overlay" onclick="closeLightbox()" style="display:none;">
      <span class="lightbox-close" onclick="closeLightbox()">&#10006; Close</span>
      <img id="lightbox-img" class="lightbox-img" src="" alt="">
      <div id="lightbox-caption" class="lightbox-caption"></div>
    </div>
    <script>
      function openLightbox(url, caption) {
        var overlay = document.getElementById('lightbox-overlay');
        var img = document.getElementById('lightbox-img');
        var cap = document.getElementById('lightbox-caption');
        img.src = url;
        cap.textContent = caption;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
      function closeLightbox() {
        document.getElementById('lightbox-overlay').style.display = 'none';
        document.body.style.overflow = '';
      }
    </script>
  `;

  html = `
  <style>
    body {font-family:Poppins,sans-serif;margin:0;padding:0;background:radial-gradient(circle at top left,#f9f8f3 60%,#efe9db 100%);}
    .header-bar {padding:20px 0 8px 0;text-align:center;background:linear-gradient(90deg,#6190e8,#a7bfe8);color:white;box-shadow:0 2px 10px #bbcafc;}
    .header-bar h1 {margin:0;font-size:2.2em;letter-spacing:1px;}
    .logout-btn {position:absolute;top:28px;right:36px;background:#d53369;color:white;padding:7px 14px;border-radius:7px;font-weight:700;text-decoration:none;}
    .upload-section {max-width:420px;margin:15px auto 24px auto;padding:18px 25px;background:rgba(255,255,255,0.7);border-radius:16px;box-shadow:0 2px 12px #abbbef;}
    .gallery-wrapper {max-width:1200px;margin:auto;padding:15px;}
    .gallery-row {display:flex;flex-wrap:nowrap;gap:28px;margin-bottom:28px;}
    .gallery-cell {
      width:220px;
      background:white;
      border-radius:14px;
      box-shadow:0 2px 20px #e6e6fa99;
      padding:18px 15px 18px 15px;
      margin-bottom:15px;
      display:flex;
      flex-direction:column;
      align-items:center;
      transition:box-shadow .18s;
    }
    .gallery-cell:hover { box-shadow:0 8px 28px #d2d2fabb; transform:translateY(-3px) scale(1.04);}
    .img-frame {background:#f6eaff;border-radius:7px;padding:6px 6px 4px 6px;box-shadow:0 1px 8px #ddd;}
    .photo-thumb {
      max-width:180px;
      max-height:180px;
      border-radius:8px;
      border:2.4px solid #d7e1ec;
      background:#eee;
      margin-bottom:7px;
      transition:.14s;
      cursor:pointer;
    }
    .gallery-cell:hover .photo-thumb { box-shadow:0 2px 15px #bee3ea; border-color:#a7bfe8;}
    .photo-caption {
      font-weight:500;
      margin-bottom:8px;
      margin-top:8px;
      text-align: center;
      word-break: break-all;
      color:#5e656c;
      background:linear-gradient(90deg,#f4eaee 70%,#e3fae5 100%);
      border-radius:7px;padding:3px 7px;font-size:1em;
    }
    .btn-bar {margin-top:5px;}
    .btn {
      padding:5px 16px;margin:0 2px;
      border:none;border-radius:7px;
      font-weight:600;
      color:#234;
      background:linear-gradient(90deg,#e0eafc 70%,#a7bfe840 100%);
      text-decoration:none;
      transition:.15s;
      box-shadow:0 1px 8px #e2e2fa66;
      cursor:pointer;
    }
    .btn:hover { background:linear-gradient(90deg,#c3fae8 70%,#f9fcf8 100%);color:#0060d6;}
    .btn-delete {background:linear-gradient(90deg,#f43369 90%,#ffe0e6 100%);color:white;}
    .btn-delete:hover {background:linear-gradient(90deg,#d53369 80%,#ffdbeb 100%);}
    @media (max-width:1050px) {.gallery-row{flex-wrap:wrap;}}
    @media (max-width:680px) {.gallery-cell{width:44vw;max-width:230px;}}
    @media (max-width:460px) {.gallery-cell{width:90vw;max-width:98vw;} .header-bar h1 {font-size:1.3em;}}
    /* Lightbox styles */
    .lightbox-overlay {
      z-index:9999;
      display:flex;
      align-items:center;
      justify-content:center;
      position:fixed;top:0;left:0;width:100vw;height:100vh;
      background:rgba(22,34,64,0.94);
      flex-direction:column;
      transition:opacity .15s;
    }
    .lightbox-img {
      max-width:86vw;
      max-height:76vh;
      margin-bottom:18px;
      border-radius:15px;
      box-shadow:0 8px 34px #000c;
      border:5px solid #fff;
      background:#efefef;
    }
    .lightbox-caption {
      font-size:1.1em;
      color:#fff;
      letter-spacing:.6px;
      background:rgba(0,0,0,0.12);
      padding:6px 24px;
      border-radius:11px;
      margin-bottom:16px;
      text-align:center;
      font-weight:bold;
    }
    .lightbox-close {
      position:absolute;top:26px;right:36px;
      font-size:1.4em;
      color:#e1e1ef;
      background:rgba(0,0,0,.22);
      padding:7px 20px;
      border-radius:44px;
      cursor:pointer;
      font-family:'Poppins',sans-serif;
      z-index:10004;
    }
    .lightbox-close:hover {background:#d33369;color:#fff;}
  </style>
  ` + html;

  res.send(html);
});

// --- UPLOAD HANDLER ---
app.post('/upload', upload.single('file'), (req, res) => {
  if (!loggedIn) return res.redirect('/');

  const megaStorage = MEGA({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD
  });

  megaStorage.once('ready', () => {
    const buffer = fs.readFileSync(req.file.path);
    const uploadFile = megaStorage.upload({ name: req.file.originalname, size: req.file.size });
    uploadFile.write(buffer);
    uploadFile.end();

    uploadFile.once('complete', () => {
      fs.unlinkSync(req.file.path);

      let files = [];
      try { files = JSON.parse(fs.readFileSync('filedata.json')); } catch {}

      files.push({ name: req.file.originalname });
      fs.writeFileSync('filedata.json', JSON.stringify(files, null, 2));

      res.redirect('/gallery');
    });

    uploadFile.once('error', (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).send('Upload error: ' + err.message);
    });
  });

  megaStorage.once('error', (err) => {
    fs.unlinkSync(req.file.path);
    res.status(500).send('MEGA login failed: ' + err.message);
  });
});

// --- DOWNLOAD HANDLER ---
app.get('/download/:filename', (req, res) => {
  if (!loggedIn) return res.redirect('/');

  const filename = req.params.filename;
  const megaStorage = MEGA({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD
  });

  megaStorage.once('ready', () => {
    let fileNode = null;
    megaStorage.root.children.forEach(child => {
      if (child.name === filename) {
        fileNode = child;
      }
    });

    if (!fileNode) {
      return res.status(404).send('File not found on MEGA.');
    }

    // For images, allow browser preview:
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
      res.setHeader('Content-Type', 'image');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    fileNode.download().pipe(res);
  });

  megaStorage.once('error', (err) => {
    res.status(500).send('MEGA login failed: ' + err.message);
  });
});

// --- DELETE HANDLER ---
app.get('/delete/:filename', (req, res) => {
  if (!loggedIn) return res.redirect('/');

  const filename = req.params.filename;
  const megaStorage = MEGA({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD
  });

  megaStorage.once('ready', () => {
    let fileNode = null;
    megaStorage.root.children.forEach(child => {
      if (child.name === filename) {
        fileNode = child;
      }
    });

    if (!fileNode) {
      return res.status(404).send('File not found on MEGA.');
    }

    fileNode.delete((err) => {
      if (err) {
        return res.status(500).send('Could not delete on MEGA: ' + err.message);
      }

      let files = [];
      try { files = JSON.parse(fs.readFileSync('filedata.json')); } catch {}
      files = files.filter(f => f.name !== filename);
      fs.writeFileSync('filedata.json', JSON.stringify(files, null, 2));

      res.redirect('/gallery');
    });
  });

  megaStorage.once('error', (err) => {
    res.status(500).send('MEGA login failed: ' + err.message);
  });
});

// --- LOGOUT ROUTE ---
app.get('/logout', (req, res) => {
  loggedIn = false;
  res.redirect('/');
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
