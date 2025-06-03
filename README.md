# 1. Stop the container
docker stop farm-finder-container

# 2. Remove the stopped container
docker rm farm-finder-container

# 3. (Assuming you've edited server.js with the regex catch-all)
# Rebuild the image
docker build -t maine-farm-finder-app .

# 4. Run the new image (interactively to see logs)
docker run -p 3000:3000 --name farm-finder-container maine-farm-finder-app

https://github.com/majorossy/phreshfoods.com.git

node processSheetData.js



http://localhost:3000/api/cache/flush-and-refresh 



ssh -i ~/.ssh/keys/ChrisPhreshPhoods.pem ec2-user@3.147.25.227


