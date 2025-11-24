const fs = require('fs-extra');
const path = require('path');

async function test() {
    try {
        console.log('Testing file loading...');

        const breweriesPath = path.join(__dirname, 'data', 'breweriesData.json');
        console.log('Brewery path:', breweriesPath);

        const breweriesExist = await fs.pathExists(breweriesPath);
        console.log('Breweries exist:', breweriesExist);

        if (breweriesExist) {
            const breweries = await fs.readJson(breweriesPath);
            console.log('Loaded breweries:', breweries.length);
            console.log('First brewery:', JSON.stringify(breweries[0], null, 2));
        }

        console.log('Test complete!');
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
