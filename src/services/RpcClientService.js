import { Wallet, RpcClient } from "constant-chain-web-js/build/wallet";

function getRpcClient() {
  return Wallet.RpcClient;
}

export function setRpcClient(server, username, password) {
  Wallet.RpcClient = new RpcClient(server, username, password);
}

export function listCustomTokens() {
  return getRpcClient().listCustomTokens();
}

export function listPrivacyTokens() {
  return getRpcClient().listPrivacyCustomTokens();
}

export function getEstimateFee(from, to, amount, privateKey) {
  return getRpcClient().getEstimateFee(from, to, amount, privateKey);
}

export function getEstimateFeeForSendingToken(
  from,
  to,
  amount,
  tokenObject,
  privateKey
) {
  console.log("getEstimateFeeForSendingToken");
  console.log("\tfrom:" + from);
  console.log("\tto: " + to);
  console.log("\tamount:" + amount);
  console.log("\ttokenObject", tokenObject);
  console.log("\tprivateKey", privateKey);
  return getRpcClient().getEstimateFeeForSendingToken(
    from,
    to,
    amount,
    tokenObject,
    privateKey
  );
}
