const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️  Building frontend...");
try {
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log("✅ Frontend built successfully!");
} catch (e) {
  console.error("❌ Failed to build frontend. Please check for errors in the frontend folder.");
  process.exit(1);
}

console.log("\n📦 Packaging frontend...");
try {
  // Use Windows built-in tar utility
  execSync('tar.exe -a -c -f frontend_build.zip -C frontend/dist *');
  console.log("✅ frontend_build.zip created successfully!");
} catch (e) {
  console.error("❌ Failed to package frontend:", e.message);
}

console.log("\n📦 Packaging backend (excluding node_modules)...");
try {
  const tempDir = path.join(__dirname, 'backend_temp');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir);
  
  const copyRecursiveSync = (src, dest) => {
    const name = path.basename(src);
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      // Exclude heavy folders that aren't needed for the server to RUN
      if (name === 'node_modules' || name === 'data' || name === '.git') return;
      
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      // Exclude existing zip files to avoid recursion
      if (name.endsWith('.zip')) return;
      fs.copyFileSync(src, dest);
    }
  };
  
  copyRecursiveSync(path.join(__dirname, 'backend'), tempDir);
  
  // Package without node_modules
  execSync('tar.exe -a -c -f backend_build.zip -C backend_temp *');
  
  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("✅ backend_build.zip created successfully!\n");
} catch (e) {
  console.error("❌ Failed to package backend:", e.message);
}

console.log("🚀 Packaging complete!");
console.log("\n---------------------------------------------------------");
console.log("📂 DEPLOYMENT INSTRUCTIONS:");
console.log("1. Upload 'frontend_build.zip' to your cPanel 'public_html' folder and extract it.");
console.log("2. Upload 'backend_build.zip' to your Node.js application root and extract it.");
console.log("3. Run 'npm install' in the backend folder on your server.");
console.log("4. Ensure your .env variables are set correctly in cPanel.");
console.log("---------------------------------------------------------\n");

