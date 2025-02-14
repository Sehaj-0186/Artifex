const axios = require('axios');
const Network = "eth";
const Pool_address = "0x60594a405d53811d3bc4766596efd80fd545a270"
const timeframe = "day"; // can be day month year
const token_address="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
async function PoolData(){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/pools/${Pool_address}`,{
            headers:{
                'accept': 'application/json'
            }
    });
         
    console.log(response.data);
    return response.data;
} catch (error) {
    console.error('Error fetching pool data:', error);
    throw error;
}
}
async function Token_data(){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/tokens/${token_address}/pools`,{
            headers:{
                'accept': 'application/json'
            }
        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error('Error fetching pool Data:', error)
        throw error;
    }
}

async function Trending_pool(Network){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/trending_pools`,{
            headers:{
                'accept': 'application/json'
            }

        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error("error fetching the trending_pool",error);
        throw error;
    }
}
async function Trending_pool_address(){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/pools/${Pool_address}`,{
            headers:{
                'accept': 'application/json'
            }

        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error("error fetching the trending_pool",error);
        throw error;
    }
}
async function New_pools(){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/new_pools`,{
            headers:{
                'accept': 'application/json'
            }

        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error("error fetching the trending_pool",error);
        throw error;
    }
}
async function ohlcvs(){
    try{
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${Network}/pools/${Pool_address}/ohlcv/${timeframe}`,{
            headers:{
                'accept': 'application/json'
            }

        });
        console.log(response.data);
        return response.data;
    }catch(error){
        console.error("error fetching the trending_pool",error);
        throw error;
    }
}
async function main(){
    // await PoolData();
    // console.log("here is the Pool data");

    // await Token_data();
    // console.log("here is the tokken Data")
    
    // console.log("here is the trending data")
    await Trending_pool("eth");
    console.log("here is the trending pool address data")
    // await Trending_pool_address();
    // console.log("here arre the new Pools")
    // await New_pools();
    // console.log("here is the data of ohlcvs: =>")
    // await ohlcvs();
}

main();
