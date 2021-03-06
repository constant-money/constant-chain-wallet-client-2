import React from "react";
import PropTypes from "prop-types";
import { Tabs, Tab } from "@material-ui/core";
import TokenList from "./TokenList";
import { Button } from "@material-ui/core";

import "./TokenTabs.scss";
import styled from "styled-components";
import { FollowTokenDialog } from "../../modules/tokens/FollowTokenDialog";
import { connectWalletContext } from "../../common/context/WalletContext";
import { connectAccountContext } from "../../common/context/AccountContext";
import { flow } from "lodash";
import { TokenHistoryDialog } from "../../modules/tokens/TokenHistoryDialog";
import * as passwordService from "../../services/PasswordService";

const mapTabNameToIndex = {
  privacy: 0,
  custom: 1
};

const mapTabIndexToName = Object.entries(mapTabNameToIndex).reduce(
  (acc, [tabName, tabIndex]) => ({
    ...acc,
    [tabIndex]: tabName
  }),
  {}
);

class TokenTabs extends React.Component {
  static propTypes = {
    paymentAddress: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      showAlert: "",
      value: mapTabNameToIndex["privacy"],
      listCustomTokenBalance: [],
      listPrivacyTokenBalance: []
    };

    props.tokenListRef.current = this;
  }

  componentDidMount() {
    this.onRefresh();
  }

  componentDidUpdate(prevProps) {
    if (this.shouldRefreshListToken(prevProps)) {
      this.onRefresh();
    }
  }

  shouldRefreshListToken = prevProps => {
    return this.props.account.name !== prevProps.account.name;
  };

  onRefresh = () => {
    console.log("TokenTabs onRefresh");
    try {
      const { wallet, account } = this.props;
      const accountWallet = wallet.getAccountByName(account.name);
      const followingTokens = accountWallet.listFollowingTokens();
      console.log("accountWallet when  followingTokens: ", accountWallet);
      console.log("followingTokens: ", followingTokens);

      this.setState({
        listCustomTokenBalance: followingTokens.filter(
          token => !token.IsPrivacy
        ),
        listPrivacyTokenBalance: followingTokens.filter(
          token => token.IsPrivacy
        )
      });
    } catch (e) {
      console.error("CAN NOT GET LIST OF FOLLOWING TOKENS");
    }
  };
  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleCreateToken = () => {
    const { value } = this.state;
    this.props.onCreateToken(value);
  };
  handleAddFollowingToken = () => {
    this.setState({ isOpenSearchTokenDialog: true });
  };
  handleUnfollow = ({ ID }) => {
    const { wallet, account } = this.props;
    const accountWallet = wallet.getAccountByName(account.name);
    accountWallet.removeFollowingToken(ID);
    wallet.save(passwordService.getPassphrase());
    this.onRefresh();
  };
  onClickHistory = ({ ID }) => {
    this.setState({ isOpenTokenHistory: true, historyTokenId: ID });
  };
  renderTabs() {
    const {
      value,
      listCustomTokenBalance,
      listPrivacyTokenBalance
    } = this.state;
    const props = {
      list: value === 0 ? listPrivacyTokenBalance : listCustomTokenBalance,
      tab: value, // depricated
      tabName: mapTabIndexToName[value],
      handleUnfollow: this.handleUnfollow,
      onClickHistory: this.onClickHistory,
      ...this.props
    };

    return (
      <>
        <Tabs
          value={value}
          indicatorColor="primary"
          variant="fullWidth"
          onChange={this.handleChange}
          className="tokenTabs"
        >
          <Tab label="PRIVACY" />
          <Tab label="NORMAL" />
        </Tabs>
        <TokenList {...props} />
      </>
    );
  }

  render() {
    return (
      <Wrapper className="TokenTabs">
        {this.renderTabs()}

        <ButtonWrapper>
          <Button
            variant="contained"
            size="medium"
            className="newTokenButton"
            onClick={this.handleCreateToken}
          >
            Create a new token
          </Button>

          <Button
            variant="contained"
            size="medium"
            className="newTokenButton"
            onClick={this.handleAddFollowingToken}
            style={{ lineHeight: "15px" }}
          >
            Add a token
          </Button>
        </ButtonWrapper>

        <FollowTokenDialog
          isOpen={this.state.isOpenSearchTokenDialog}
          onClose={() => this.setState({ isOpenSearchTokenDialog: false })}
          tabName={mapTabIndexToName[this.state.value]}
          refreshTokenList={this.onRefresh}
          followedTokens={
            this.state.value === 0
              ? this.state.listPrivacyTokenBalance
              : this.state.listCustomTokenBalance
          }
        />

        <TokenHistoryDialog
          tokenId={this.state.historyTokenId}
          tabName={mapTabIndexToName[this.state.value]}
          isOpen={this.state.isOpenTokenHistory}
          onClose={() => this.setState({ isOpenTokenHistory: false })}
        />
      </Wrapper>
    );
  }
}

export default flow([connectWalletContext, connectAccountContext])(TokenTabs);

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const ButtonWrapper = styled.div`
  text-align: center;
  button {
    margin-bottom: 10px;
  }
`;
