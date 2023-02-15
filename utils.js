const HashOfDepositIn = "0xb7100086a8e13ebae772a0f09b07046e389a6b036406d22b86f2d2e5b860a8d9"
const HashOfSwapIn = "0xca1cf8cebf88499429cca8f87cbca15ab8dafd06702259a5344ddce89ef3f3a5"
const TransferIn = "transferIn"
const DepositIn = "depositIn"
const SwapIn = "swapIn"

function getMethod (topic) {
    let method = TransferIn;
    if (topic === HashOfDepositIn) {
        method = DepositIn
    } else if(topic === HashOfSwapIn) {
        method = SwapIn
    }

    return method
}
