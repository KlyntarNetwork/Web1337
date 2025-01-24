import Web1337, {SIGNATURES_TYPES} from '../index.js'

import crypto from '../crypto_primitives/crypto.js'

import bls from '../crypto_primitives/bls.js'





/*
    
    
                   ████████╗██████╗  █████╗ ███╗   ██╗███████╗ █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
                    ══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
                      ██║   ██████╔╝███████║██╔██╗ ██║███████╗███████║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
                      ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
                      ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
                      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

                    ██████╗██████╗ ███████╗ █████╗ ████████╗██╗███╗   ██╗ ██████╗                                    
                    █╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝                                    
                    █║     ██████╔╝█████╗  ███████║   ██║   ██║██╔██╗ ██║██║  ███╗                                   
                    █║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██║██║╚██╗██║██║   ██║                                   
                    ██████╗██║  ██║███████╗██║  ██║   ██║   ██║██║ ╚████║╚██████╔╝                                   
                    ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝                                    


*/


let toBigIntString = value => BigInt(Math.round(value * 1e18)).toString();


export let getTransactionTemplate=(workflowVersion,creator,txType,sigType,nonce,fee,payload)=>{

    fee = toBigIntString(fee);

    if(payload.amount) payload.amount = toBigIntString(payload.amount);

    if(payload?.params?.amount) payload.params.amount = toBigIntString(payload.params.amount);


    return {

        v:workflowVersion,
        creator,
        type:txType,
        nonce,
        fee,
        payload,
        sigType,
        sig:''

    }

}



// Transactions. Default, Multisig, Threshold, Post-quantum

/**
 * 
 * @param {Web1337} web1337 
 */
export let createEd25519Transaction=(web1337,txType,yourAddress,yourPrivateKey,nonce,fee,payload)=>{

    let workflowVersion = web1337.chains.get(web1337.currentChain).workflowVersion

    let transaction = getTransactionTemplate(workflowVersion,yourAddress,txType,SIGNATURES_TYPES.DEFAULT,nonce,fee,payload)

    transaction.sig = crypto.ed25519.signEd25519(web1337.currentChain+workflowVersion+txType+JSON.stringify(payload)+nonce+fee,yourPrivateKey)

    // Return signed transaction

    return transaction

}



/**
 * 
 * @param {Web1337} web1337 
 */
export let signDataForMultisigTransaction=(web1337,txType,blsPrivateKey,nonce,fee,payload)=>{

    let workflowVersion = web1337.chains.get(web1337.currentChain).workflowVersion

    let txTemplate = getTransactionTemplate(workflowVersion,'',txType,SIGNATURES_TYPES.MULTISIG,nonce,fee,payload)

    let dataToSign = web1337.currentChain+workflowVersion+txType+JSON.stringify(txTemplate.payload)+nonce+txTemplate.fee

    let singleSigna = bls.singleSig(dataToSign,blsPrivateKey)

    return singleSigna

}



/**
 * 
 * @param {Web1337} web1337 
 */
export let createMultisigTransaction=async(web1337,txType,rootPubKey,aggregatedSignatureOfActive,nonce,fee,payload)=>{

    let workflowVersion = web1337.chains.get(web1337.currentChain).workflowVersion

    let multisigTransaction = getTransactionTemplate(workflowVersion,rootPubKey,txType,SIGNATURES_TYPES.MULTISIG,nonce,fee,payload)

    multisigTransaction.sig = aggregatedSignatureOfActive

    // Return signed tx
    return multisigTransaction

}

/**
 * 
 * @param {Web1337} web1337 
 */
export let buildPartialSignatureWithTxData=(web1337,txType,hexID,sharedPayload,nonce,fee,payloadForTblsTransaction)=>{

    let workflowVersion = web1337.chains.get(web1337.currentChain).workflowVersion

    let txTemplate = getTransactionTemplate(workflowVersion,'',txType,SIGNATURES_TYPES.TBLS,nonce,fee,payloadForTblsTransaction)

    let dataToSign = web1337.currentChain+workflowVersion+txType+JSON.stringify(txTemplate.payload)+nonce+txTemplate.fee

    let partialSignature = crypto.tbls.signTBLS(hexID,sharedPayload,dataToSign)
        
    return partialSignature

}




/**
 * 
 * @param {Web1337} web1337 
 */
export let createThresholdTransaction = (web1337,txType,tblsRootPubkey,partialSignaturesArray,nonce,fee,tblsPayload) => {

    let thresholdSigTransaction = getTransactionTemplate(
            
        web1337.chains.get(web1337.currentChain).workflowVersion,
            
        tblsRootPubkey,
            
        txType,

        SIGNATURES_TYPES.TBLS,
            
        nonce, fee, tblsPayload
            
    )
        
    thresholdSigTransaction.sig = crypto.tbls.buildSignature(partialSignaturesArray)
 
    return thresholdSigTransaction
 
}




/**
 * 
 * @param {Web1337} web1337
 */
export let createPostQuantumTransaction = (web1337,txType,pqcAlgorithm,yourAddress,yourPrivateKey,nonce,fee,payload)=>{

    let workflowVersion = web1337.chains.get(web1337.currentChain).workflowVersion

    let sigTypeToAddToTx = pqcAlgorithm === 'bliss' ? SIGNATURES_TYPES.POST_QUANTUM_BLISS : SIGNATURES_TYPES.POST_QUANTUM_DILITHIUM

    let transaction = getTransactionTemplate(workflowVersion,yourAddress,txType,sigTypeToAddToTx,nonce,fee,payload)

    let funcRef = pqcAlgorithm === 'bliss' ? crypto.pqc.bliss : crypto.pqc.dilithium


    transaction.sig = funcRef.signData(yourPrivateKey,web1337.currentChain+workflowVersion+txType+JSON.stringify(transaction.payload)+nonce+transaction.fee)

    // Return signed transaction

    return transaction

}


/**
 * 
 * @param {Web1337} web1137
 * @returns 
 */
export let sendTransaction = (web1137,transaction) => web1137.postRequestToNode('/transaction',transaction)
