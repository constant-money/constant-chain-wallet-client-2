import React from "react";
import styled from "styled-components";
import { truncate } from "lodash";
import { useAccountContext } from "../../common/context/AccountContext";
import { useWalletContext } from "../../common/context/WalletContext";
import {
  SuccessTx,
  ConfirmedTx,
  getTokenImage
} from "constant-chain-web-js/build/wallet";
import Avatar from "@material-ui/core/Avatar";
import SendCoinCompletedInfo from "@src/common/components/completedInfo/sendCoin";
import Dialog from "@src/components/core/Dialog";
import moment from "moment";
import { formatConstantBalance, formatDate } from "@src/common/utils/format";
import { OptionMenu } from "@src/common/components/popover-menu/OptionMenu";
import { hashToIdenticon } from "@src/services/RpcClientService";

const url = `${process.env.CONSTANT_EXPLORER}/tx/`;

function truncateMiddle(str = "") {
  return truncate(str, { length: 10 }) + str.slice(-4);
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_HISTORY":
      return {
        ...state,
        history: action.history
      };
    default:
      throw new Error();
  }
}

/**
 * NOTE: Only show sending history for now
 */
export function HistoryItem({ history, onSendConstant }) {
  const [dialogContent, setDialogContent] = React.useState(null);
  const [dialog, setDialog] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, {
    history: []
  });

  let account = useAccountContext();
  let { wallet } = useWalletContext();

  React.useEffect(() => {
    loadHistory();
  }, [history]);

  async function loadHistory() {
    console.log("Load history when change account!!!!");
    let history = await wallet.getHistoryByAccount(account.name);
    dispatch({
      type: "SET_HISTORY",
      history
    });
  }

  function compare(a, b) {
    if (a.time < b.time) return 1;
    if (a.time > b.time) return -1;
    return 0;
  }

  function showHistoryDialog(history, receiverAddress) {
    setDialogContent(
      <SendCoinCompletedInfo
        onClose={() => null}
        amount={formatConstantBalance(history?.amount)}
        toAddress={receiverAddress}
        txId={history?.txID}
        createdAt={history?.time}
        completedInfoProps={{
          isPrivacy: history.isPrivacy === 1
        }}
      />
    );
    dialog && dialog.open();
  }

  function onClickResendMenuItem(history) {
    if (!history) {
      return;
    }
    let props = {
      toAddress: history.receivers[0],
      amount: formatConstantBalance(history.amount),
      isPrivacy: Number(history.isPrivacy).toString()
    };
    onSendConstant(account, props);
  }

  let history = state.history;
  history.sort(compare);
  return (
    <Item key={item.txID}>
      <Div>
        <Row1>
          <div style={{ display: "flex" }}>
            <TxID>
              <a href={url + item.txID} target="_blank">
                <Avatar
                  alt={image && image.length > 0 ? item.txID : "fail"}
                  src={image}
                />
              </a>
            </TxID>

            <Time>{createdTime}</Time>
          </div>
          <OptionMenu items={items} />
        </Row1>

        <Row2>
          <Left>
            {(item.receivers || []).map((receiverItem, i) => {
              return (
                <Receiver
                  title={receiverItem}
                  key={i}
                  onClick={() => showHistoryDialog(item, receiverItem)}
                >
                  To: {truncateMiddle(receiverItem)}
                </Receiver>
              );
            })}
          </Left>
          <Right>
            {item.isIn ? "+" : "-"} {formatConstantBalance(item.amount)} CONST
          </Right>
        </Row2>

        <Row3>
          <Left>
            <Fee>Fee: {item.fee}</Fee>
          </Left>
          <Right>
            <Status className={statusClass}>
              <p>{statusText}</p>
            </Status>
          </Right>
        </Row3>
      </Div>
    </Item>
  );
}

const Fee = styled.div`
  color: #050c33;
  font-size: 12px;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 10px 0px;
  border-bottom: 1px solid #e4e7f2;
`;

const TxID = styled.div`
  margin-bottom: 18px;
  color: #838aa7;
  font-size: 14px;
`;

const Receiver = styled.div`
  font-size: 16px;
  color: #050c33;
  flex: 1;
  display: flex;
  cursor: pointer;
`;

const Div = styled.div`
  display: flex;
  flex-direction: column;
`;

const Right = styled.div`
  flex: 1;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
  color: #050c33;
  margin: auto;
  height: 100%;
`;

const Status = styled.div`
  text-align: center;
  margin: auto;
  width: 50%;
  margin-right: 0;
  height: 100%;
  font-size: 12px;
  &.success {
    color: #8bc34a;
  }
  &.failed {
    color: #e53935;
  }
  &.confirmed {
    color: #dce775;
  }
`;

const Left = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 50px;
  margin: auto;
  padding: 0px !important;
  margin: 0px !important;
`;

const Time = styled.div`
  color: #050c33;
  margin: 10px 0px 0px 10px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
`;

const Row1 = styled.div`
  color: #00529b;
  flex-direction: row;
  height: 50px;
  display: flex;
  justify-content: space-between;
`;

const Row2 = styled.div`
  color: #00529b;
  display: flex;
  flex-direction: row;
  height: 40px;
`;
const Row3 = styled.div`
  color: #00529b;
  display: flex;
  flex-direction: row;
  height: 40px;
`;
