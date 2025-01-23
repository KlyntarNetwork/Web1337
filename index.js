/*


                        ██╗    ██╗███████╗██████╗        ██╗██████╗ ██████╗ ███████╗                            
                        ██║    ██║██╔════╝██╔══██╗      ███║╚════██╗╚════██╗╚════██║                            
                        ██║ █╗ ██║█████╗  ██████╔╝█████╗╚██║ █████╔╝ █████╔╝    ██╔╝                            
                        ██║███╗██║██╔══╝  ██╔══██╗╚════╝ ██║ ╚═══██╗ ╚═══██╗   ██╔╝                             
                        ╚███╔███╔╝███████╗██████╔╝       ██║██████╔╝██████╔╝   ██║                              
                         ╚══╝╚══╝ ╚══════╝╚═════╝        ╚═╝╚═════╝ ╚═════╝    ╚═╝                              
                                                                                                                
                                                                                                                
                                                                                                                
                                                                                          
                                                                                                                
                                                                                                                
 ██████╗██████╗ ███████╗ █████╗ ████████╗███████╗██████╗     ███████╗ ██████╗ ██████╗     ██╗  ██╗██╗  ██╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗    ██║ ██╔╝██║  ╚██╗ ██╔╝
██║     ██████╔╝█████╗  ███████║   ██║   █████╗  ██║  ██║    █████╗  ██║   ██║██████╔╝    █████╔╝ ██║   ╚████╔╝ 
██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝  ██║  ██║    ██╔══╝  ██║   ██║██╔══██╗    ██╔═██╗ ██║    ╚██╔╝  
╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗██████╔╝    ██║     ╚██████╔╝██║  ██║    ██║  ██╗███████╗██║   
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝     ╚═╝      ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝   



    _____________________________________________ INFO _____________________________________________

    Only general API & functionality present here. We'll extend abilities via modules & other packages and so on

    You can also use web3.js EVM-compatible API with blockchains in KLY ecosystem that supports KLY-EVM


*/

import * as smartContractsApi from './src/smart_contract_api.js'

import * as txsCreation from './src/txs_creation.js'

import crypto from './crypto_primitives/crypto.js'

import {hash} from 'blake3-wasm'

import fetch from 'node-fetch'








// For future support of WSS
// import WS from 'websocket' // https://github.com/theturtle32/WebSocket-Node


// For proxy support

import {SocksProxyAgent} from 'socks-proxy-agent'
import {HttpsProxyAgent} from 'https-proxy-agent'



const TX_TYPES = {

    TX:'TX', // default address <=> address tx
    WVM_CONTRACT_DEPLOY:'WVM_CONTRACT_DEPLOY', // deployment of WASM contact to KLY-WVM 
    WVM_CALL:'WVM_CALL', // call the WASM contact to KLY-WVM

}

const SIGNATURES_TYPES = {
    
    DEFAULT:'D',                    // Default ed25519
    TBLS:'T',                       // TBLS(threshold sig)
    POST_QUANTUM_DILITHIUM:'P/D',   // Post-quantum Dilithium(2/3/5,2 used by default)
    POST_QUANTUM_BLISS:'P/B',       // Post-quantum BLISS
    MULTISIG:'M'                    // Multisig BLS

}


const getCostPerSignatureType = transaction => {

    if(transaction.sigType==='D') return 5000n
    
    if(transaction.sigType==='T') return 10000n

    if(transaction.sigType==='P/D') return 15000n

    if(transaction.sigType==='P/B') return 15000n

    if(transaction.sigType==='M') return 7000n + BigInt(transaction.payload.afk.length) * 1000n

    return 0n

}




export {TX_TYPES,SIGNATURES_TYPES}

export {crypto}


export default class {

    /**
     * 
     * @param {String} [options.chainID] identificator of KLY chain to work with
     * @param {Number} [options.workflowVersion] identificator of appropriate version of chain's workflow
     * @param {String} [options.nodeURL] endpoint of node to interact with
     * @param {String} [options.proxyURL] HTTP(s) / SOCKS proxy url
     * 
     * 
     */
    constructor(options = {chainID,workflowVersion,nodeURL,proxyURL}){

        let {chainID,workflowVersion,nodeURL,proxyURL} = options;

        if(proxyURL === 'string'){

            if(proxyURL.startsWith('http')) this.proxy = new HttpsProxyAgent(proxyURL)  // for example => 'http(s)://login:password@127.0.0.1:8080'

            else if (proxyURL.startsWith('socks'))  this.proxy = new SocksProxyAgent(proxyURL) // for TOR/I2P connections. For example => socks5h://Vlad:Cher@127.0.0.1:9150

        }

        this.chains = new Map() // chainID => {nodeURL,workflowVersion}


        // Set the initial values

        this.currentChain = chainID

        this.chains.set(chainID,{nodeURL,workflowVersion})

    }


    blake3=(input,length)=>hash(input,{length}).toString('hex')

    getRequestToNode=url=>{

        let {nodeURL} = this.chains.get(this.currentChain)

        return fetch(nodeURL+url,{agent:this.proxy}).then(r=>r.json()).catch(error=>error)

    }


    postRequestToNode=(url,bodyToSend)=>{

        let {nodeURL} = this.chains.get(this.currentChain)

        return fetch(nodeURL+url,{

            method:'POST',
            body:JSON.stringify(bodyToSend),
            agent:this.proxy

        }).then(r=>r.json()).catch(error=>error)

    }

    /*
    
    
                         █████╗ ██████╗ ██╗
                        ██╔══██╗██╔══██╗██║
                        ███████║██████╔╝██║
                        ██╔══██║██╔═══╝ ██║
                        ██║  ██║██║     ██║
                        ╚═╝  ╚═╝╚═╝     ╚═╝
    
    
    */




    //_________________________Block API_________________________

    getBlockByBlockID=blockID=>this.getRequestToNode('/block/'+blockID)

    getBlockBySID=(blockHeight)=>this.getRequestToNode(`/block_by_sid/${blockHeight}`)

    getLatestNBlocks=(startIndex,limit)=>this.getRequestToNode(`/latest_n_blocks/${startIndex}/${limit}`)
    
    getVerificationThreadStats=()=>this.getRequestToNode(`/verification_thread_stats`)



    //_______________________Epoch data API______________________

    getCurrentEpochOnThread=threadID=>this.getRequestToNode('/current_epoch/'+threadID)

    getCurrentLeader=()=>this.getRequestToNode(`/current_leader`)

    getEpochDataByEpochIndex=epochIndex=>this.getRequestToNode(`/epoch_by_index/${epochIndex}`)

    getVerificationThreadStatsPerEpoch=epochIndex=>this.getRequestToNode(`/verification_thread_stats_per_epoch/${epochIndex}`)


    //_______________________State data API____________________

    getFromStateByCellID=(cellID)=>this.getRequestToNode(`/state/${cellID}`)

    getTransactionReceiptById=txID=>this.getRequestToNode('/tx_receipt/'+txID)

    getPoolStats=poolID=>this.getRequestToNode('/pool_stats/'+poolID)

    getTransactionsWithAccount=(accountID)=>this.getRequestToNode(`/txs_list/${accountID}`)

    getAccount=(accountID)=>this.getRequestToNode(`/account/${accountID}`)



    //_______________________Misc data API_____________________

    getTargetNodeInfrastructureInfo=()=>this.getRequestToNode('/infrastructure_info')

    getChainData=()=>this.getRequestToNode('/chain_info')

    getKlyEvmMetadata=()=>this.getRequestToNode('/kly_evm_metadata')

    getSynchronizationStatus=()=>this.getRequestToNode('/synchronization_stats')

    getQuorumUrlsAndPubkeys=()=>this.getRequestToNode('/quorum_urls_and_pubkeys')




    //___________________Consensus-related API___________________

    getAggregatedEpochFinalizationProof = epochIndex => this.getRequestToNode(`/aggregated_epoch_finalization_proof/${epochIndex}`)

    getAggregatedFinalizationProofForBlock=blockID=>this.getRequestToNode('/aggregated_finalization_proof/'+blockID)




    //_____________________________ TXS Creation _____________________________

    createEd25519Transaction=(txType,yourAddress,yourPrivateKey,nonce,fee,payload)=>{

        return txsCreation.createEd25519Transaction(this,txType,yourAddress,yourPrivateKey,nonce,fee,payload)

    }

    signDataForMultisigTransaction=(txType,blsPrivateKey,nonce,fee,payload)=>{

        return txsCreation.signDataForMultisigTransaction(this,txType,blsPrivateKey,nonce,fee,payload)

    }

    createMultisigTransaction=(rootPubKey,txType,aggregatedSignatureOfActive,nonce,fee,payload)=>{

        return txsCreation.createMultisigTransaction(this,txType,rootPubKey,aggregatedSignatureOfActive,nonce,fee,payload)

    }

    buildPartialSignatureWithTxData=(txType,hexID,sharedPayload,nonce,fee,payload)=>{

        return txsCreation.buildPartialSignatureWithTxData(this,txType,hexID,sharedPayload,nonce,fee,payload)

    }

    createThresholdTransaction=(tblsRootPubkey,txType,partialSignaturesArray,nonce,fee,payload)=>{

        return txsCreation.createThresholdTransaction(this,txType,tblsRootPubkey,partialSignaturesArray,nonce,fee,payload)

    }
    
    createPostQuantumTransaction=(txType,pqcAlgorithm,yourAddress,yourPrivateKey,nonce,fee,payload)=>{
    
        return txsCreation.createPostQuantumTransaction(this,txType,pqcAlgorithm,yourAddress,yourPrivateKey,nonce,fee,payload)
    
    }

    
    sendTransaction=(transaction)=>txsCreation.sendTransaction(this,transaction)




    //_________________________ Smart contracts API __________________________

    getContractMetadata=(contractID)=>smartContractsApi.getContractMetadata(this,contractID)

    getContractStorage=(contractID,storageName)=>smartContractsApi.getContractStorage(this,contractID,storageName)


    //_________________ To work with other chains _______________

    addChain=(chainID,workflowVersion,nodeURL)=>this.chains.set(chainID,{nodeURL,workflowVersion})

    changeCurrentChain=chainID=>this.currentChain=chainID

    //_________________ Other useful methods ________________

    calculateFeeAndAbstractGas = tx => {

        let requiredFee = getCostPerSignatureType(tx)

        if(tx.type === 'WVM_CONTRACT_DEPLOY'){
    
            requiredFee += 2000n * BigInt(tx.payload.bytecode.length / 2) // 0.000002 KLY per byte

            requiredFee += 2_000_000n * BigInt(JSON.stringify(tx.payload.constructorParams.initStorage).length)

        } else if(tx.type === 'WVM_CALL'){

            let totalSize = JSON.stringify(tx.payload).length

            requiredFee += 2_000_000n * BigInt(totalSize)

            requiredFee += BigInt(tx.payload.gasLimit)

        } // TODO: Add EVM_CALL type


        // Calculate also how much does transaction will cost in abstract gas
        // NOTE: It's only dependent on tx size and wished gas limit

        let requiredAbstractGas = getCostPerSignatureType(tx) * 2n

        if(tx.type === 'WVM_CONTRACT_DEPLOY'){
    
            requiredAbstractGas += BigInt(tx.payload.bytecode.length/2)

        } else if(tx.type === 'WVM_CALL'){

            let totalSize = JSON.stringify(tx.payload)

            requiredAbstractGas += BigInt(totalSize)

            requiredAbstractGas += BigInt(tx.payload.gasLimit)

        } // TODO: Add EVM_CALL type
    
        return {requiredFee, requiredAbstractGas}

    }

}