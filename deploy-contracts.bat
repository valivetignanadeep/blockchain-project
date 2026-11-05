@echo off
echo ===================================================
echo Deploying and Seeding EcommerceStore Contract...
echo ===================================================
npx hardhat run scripts/deploy.js --network localhost
pause
