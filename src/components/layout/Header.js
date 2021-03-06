import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import AccountDetail from "./Account/AccountDetail";

import {
  AppBar,
  IconButton,
  SwipeableDrawer,
  Toolbar,
  Divider,
  Typography,
  ListItem,
  List,
  Snackbar,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu
} from "@material-ui/core";

import {
  ExitToApp as IconExitToApp,
  Home as IconHome,
  Fullscreen as IconFullScreen,
  Settings as IconSettings,
  Info as IconInfo,
  AccountCircle,
  Menu as MenuIcon,
  Error as IconError,
  CheckCircle as IconSuccess,
  Warning as IconWarning
} from "@material-ui/icons";

import { ReactComponent as CreateAccountSVG } from "@assets/images/create-account.svg";
import { ReactComponent as ImportAccountSVG } from "@assets/images/import-account.svg";
import { ReactComponent as ExitAppIcon } from "@assets/images/exit-app-icon.svg";
import "./Header.scss";

import AccountList from "../layout/Account/AccountList";
import styled from "styled-components";
import { connectAppContext } from "../../common/context/AppContext";
import { connectWalletContext } from "../../common/context/WalletContext";
import { get, flow } from "lodash";
import { Subject } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import { HeaderSelectedAccount } from "../../modules/account/HeaderSelectedAccount";
import * as passwordService from "../../services/PasswordService";
import {
  getAccountBalance,
  hasAccountBalance,
  saveAccountBalance
} from "../../services/CacheAccountBalanceService";

const styles = {
  grow: {
    flexGrow: 1
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  }
};

class Header extends React.Component {
  static propTypes = {
    accounts: PropTypes.array.isRequired,
    onChangeAccount: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      auth: true,
      anchorEl: null,
      title: props.title,
      left: false,
      showAlert: "",
      isAlert: false,
      balances: []
    };

    this.balanceSubjects = [];
  }

  componentDidMount() {
    if (get(this, "props.accounts.length")) {
      this.resetRegisterBalanceSubjects();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.accounts !== prevProps.accounts) {
      this.resetRegisterBalanceSubjects();
    }

    // when user click to open menu, fire an event to registered subject
    if (this.state.anchorEl !== prevState.anchorEl) {
      if (this.state.anchorEl) {
        this.balanceSubjects.forEach(subject => {
          if (subject) {
            subject.next(true);
          }
        });
      }
    }
  }

  //register subject for each account
  resetRegisterBalanceSubjects = () => {
    if (this.balanceSubjects) {
      this.balanceSubjects.forEach(subject => {
        if (subject) {
          subject.unsubscribe();
        }
      });
    }
    this.balanceSubjects = this.props.accounts.map(({ name }) => {
      const subject = new Subject();
      subject
        .pipe(
          debounceTime(720),
          switchMap(this.loadBalance(name))
        )
        .subscribe(balance => {
          if (balance >= 0) {
            saveAccountBalance(balance, name);
          }
          (async () => {
            this.props.wallet.save("");
            console.log("wallet", this.props.wallet);
          })();
          this.props.app.appDispatch({
            type: "SET_ACCOUNT_BALANCE",
            accountName: name,
            balance: balance
          });
        });
      return subject;
    });
  };
  loadBalance = name => () => {
    let balance = getAccountBalance(name);
    if (balance > -1) {
      return new Promise(resolve => setTimeout(resolve(balance), 1));
    }
    let balancePromise = this.props.wallet.getAccountByName(name).getBalance();
    return balancePromise;
  };

  handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    this.setState({ showAlert: "", isAlert: false });
  };

  showAlert = (
    msg,
    { flag = "warning", html = false, duration = 2000, hideIcon = false }
  ) => {
    let showAlert = "",
      isAlert = true,
      icon = "";

    if (flag === "success") icon = <IconSuccess />;
    else if (flag === "danger") icon = <IconError />;
    else if (flag === "warning") icon = <IconWarning />;

    this.setState({ isAlert }, () => {
      showAlert = (
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center"
          }}
          open={isAlert}
          autoHideDuration={duration}
          onClose={this.handleClose}
        >
          <div className={"alert alert-" + flag} role="alert">
            {!hideIcon && icon} {msg}
          </div>
        </Snackbar>
      );

      this.setState({ showAlert });
    });
  };

  showSuccess = msg => {
    this.showAlert(msg, { flag: "success", duration: 3000, hideIcon: true });
  };

  showWarning = msg => {
    this.showAlert(msg, { flag: "warning" });
  };

  showError = msg => {
    this.showAlert(msg, { flag: "danger" });
  };

  showInfo = msg => {
    this.showAlert(msg, { flag: "info", duration: 3000, hideIcon: true });
  };

  expandView = () => {
    let chromeId = window.chrome.runtime.id;
    if (chromeId) {
      window.open("chrome-extension://" + chromeId + "/index.html");
      return;
    } else {
      this.showWarning("This feature is only on chrome extension");
      return;
    }
  };

  viewConstantExplorer = () => {
    window.open(process.env.CONSTANT_EXPLORER);
    return;
  };

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open
    });
  };

  handleChange = event => {
    this.setState({ auth: event.target.checked });
  };

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  selectMenu = menu => {
    const { callbackSelected } = this.props;

    this.setState({ anchorEl: null }, () => {
      if (callbackSelected) {
        callbackSelected(menu);
      }
    });
  };

  backHome = () => {
    this.props.app.appDispatch({
      type: "SET_SCREEN",
      screen: <AccountDetail />,
      headerTitle: "Wallet",
      shouldShowHeader: true
    });
  };
  handleChangeAccount = account => {
    this.setState({ anchorEl: null });
    this.props.onChangeAccount(account);
  };

  get sideList() {
    const { classes } = this.props;

    return (
      <div className={classes.list}>
        <List>
          <ListItem button key="home" onClick={() => this.backHome()}>
            <ListItemIcon>
              <IconHome />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button key="expandView" onClick={() => this.expandView()}>
            <ListItemIcon>
              <IconFullScreen />
            </ListItemIcon>
            <ListItemText primary="Expand View" />
          </ListItem>
          <ListItem
            button
            key="ninjaConstant"
            onClick={() => this.viewConstantExplorer()}
          >
            <ListItemIcon>
              <IconExitToApp />
            </ListItemIcon>
            <ListItemText primary="View on Incognito Explorer" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            key="info"
            onClick={() => this.showInfo("Coming soon!")}
          >
            <ListItemIcon>
              <IconInfo />
            </ListItemIcon>
            <ListItemText primary="Info & Help" />
          </ListItem>
          <ListItem
            button
            key="settings"
            onClick={() => this.selectMenu("SETTINGS")}
          >
            <ListItemIcon>
              <IconSettings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </div>
    );
  }

  renderAccountList = () => {
    const { accounts } = this.props;
    return (
      <AccountList
        accounts={accounts}
        onChangeAccount={this.handleChangeAccount}
      />
    );
  };
  logout = () => {
    passwordService.clearPassword();
    window.location.reload();
  };
  renderMenu = () => {
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);
    return (
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        open={open}
        onClose={this.handleClose}
      >
        {this.renderAccountList()}
        <MenuItem onClick={() => this.selectMenu("CREATE_ACCOUNT")}>
          {/* style={{ marginLeft: "10px" }} */}
          <ListItemIcon>
            <CreateAccountSVG />
          </ListItemIcon>
          Create Account
        </MenuItem>
        <MenuItem onClick={() => this.selectMenu("IMPORT_ACCOUNT")}>
          <ListItemIcon>
            <ImportAccountSVG />
          </ListItemIcon>
          Import Account
        </MenuItem>
        <MenuItem onClick={() => this.logout()}>
          <ListItemIcon>
            <ExitAppIcon />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    );
  };

  render() {
    const { classes, title } = this.props;
    const { auth, anchorEl, showAlert } = this.state;
    const open = Boolean(anchorEl);

    return (
      <Wrapper>
        {showAlert}
        <StyledAppBar classes={{ root: "AppBar" }} position="static">
          <Toolbar>
            <IconButton
              onClick={this.toggleDrawer("left", true)}
              className={classes.menuButton}
              color="inherit"
              aria-label="Menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              {title}
            </Typography>
            {auth && (
              <div>
                <IconButton
                  aria-owns={open ? "menu-appbar" : undefined}
                  aria-haspopup="true"
                  onClick={this.handleMenu}
                  color="inherit"
                >
                  <HeaderSelectedAccount />
                  <AccountCircle />
                </IconButton>
                {this.renderMenu()}
              </div>
            )}
          </Toolbar>
        </StyledAppBar>
        <SwipeableDrawer
          open={this.state.left}
          onClose={this.toggleDrawer("left", false)}
          onOpen={this.toggleDrawer("left", true)}
        >
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer("left", false)}
            onKeyDown={this.toggleDrawer("left", false)}
          >
            {this.sideList}
          </div>
        </SwipeableDrawer>
      </Wrapper>
    );
  }
}

Header.propTypes = {
  classes: PropTypes.object.isRequired
};

export default flow([
  withStyles(styles),
  connectAppContext,
  connectWalletContext
])(Header);

const StyledAppBar = styled(AppBar)`
  &.AppBar {
    background-color: #2d4cf5;
  }
`;

const Wrapper = styled.div``;
