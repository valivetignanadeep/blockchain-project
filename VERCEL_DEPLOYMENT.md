# Deploying ChainStore to Vercel (Continuous Deployment Guide)

This project is fully configured so that **every time you push an update or run the deploy command, it automatically builds and deploys to Vercel without manual configuration**.

---

## ⚡ How It Works Under the Hood

The repository includes pre-configured Vercel build specifications:
- [`vercel.json`](./vercel.json): Instructs Vercel to install frontend dependencies, compile Vite assets into `frontend/dist`, and configure Single Page Application (SPA) rewrites.
- [`package.json`](./package.json): Defines the standard `"build"` and `"vercel-build"` commands (`npm --prefix frontend install && npm --prefix frontend run build`).
- **Cloud Fallback Web3 Engine**: When running on Vercel, the app automatically loads cloud fallback data for all 14 products, active escrow orders, and verified reviews, while still allowing visitors to connect real **MetaMask** wallets on Sepolia or local testnets.

---

## 🚀 Option 1: Automatic Deployments via GitHub (Recommended)

This connects your GitHub repository directly to Vercel. **Every time you run `git push`, Vercel will automatically build and deploy the new version.**

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g., `blockchain-ecommerce-project`).

### Step 2: Push Your Local Code to GitHub
In your project directory terminal (PowerShell), run:

```powershell
# 1. Rename branch to main
git branch -M main

# 2. Link your GitHub repository (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/blockchain-ecommerce-project.git

# 3. Push to GitHub
git push -u origin main
```

### Step 3: Import into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** $\to$ **"Project"**.
3. Select your GitHub repository (`blockchain-ecommerce-project`) and click **"Import"**.
4. Keep the default settings (Vercel automatically reads `vercel.json`).
5. Click **"Deploy"**.

✅ **Done!** Within ~30 seconds, Vercel will give you a live HTTPS link (e.g., `https://chainstore-protocol.vercel.app`).  
**Every future `git commit` and `git push` will automatically trigger a new deployment.**

---

## 💻 Option 2: Deploy Directly via Vercel CLI (From Terminal)

You can also deploy directly from your local command line without connecting GitHub:

```powershell
# Run Vercel deployment tool
npx vercel
```

### Prompts:
1. `Set up and deploy?`: Type `y` and press Enter.
2. `Which scope?`: Select your Vercel account.
3. `Link to existing project?`: Type `n` (for first-time setup).
4. `What's your project's name?`: Press Enter (defaults to `blockchain-ecommerce-system`).
5. `In which directory is your code located?`: Press Enter (`./`).
6. `Want to modify these settings?`: Type `n` (settings in `vercel.json` are automatically used).

For production deployment:
```powershell
npx vercel --prod
```

---

## 🌐 Deploying Smart Contracts to Live Ethereum Sepolia Testnet

If you wish to deploy the smart contracts to the live Ethereum Sepolia network for your public Vercel dApp:

1. Obtain a free Sepolia RPC URL from [Infura](https://infura.io) or [Alchemy](https://alchemy.com).
2. Get free Sepolia test ETH from a faucet (e.g. [sepoliafaucet.com](https://sepoliafaucet.com)).
3. Create a `.env` file in the project root:
   ```env
   SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"
   PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
   ```
4. Deploy the contracts:
   ```powershell
   npx hardhat run scripts/deploy.js --network sepolia
   ```
5. Commit the updated `frontend/src/contracts/EcommerceStore.json` and push to GitHub (`git add . ; git commit -m "Deploy to Sepolia" ; git push`). Vercel will auto-deploy the updated testnet contract!
