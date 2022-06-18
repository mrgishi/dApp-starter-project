import React, { useEffect, useState } from "react";
import "./App.css";
import { BsCheck2Circle } from "react-icons/bs";
import { BsEmojiWinkFill } from "react-icons/bs";
import { FaGrinTongueWink } from "react-icons/fa";

/* ethers 変数を使えるようにする*/
import { ethers } from "ethers";
/* ABIファイルを含むWavePortal.jsonファイルをインポートする*/
import abi from "./utils/WavePortal.json";
import { Card } from "./components/Card";
import { Loader } from "./components/Loader";

const App = () => {
  /* ユーザーのパブリックウォレットを保存するために使用する状態変数を定義 */
  const [currentAccount, setCurrentAccount] = useState("");
  /* ユーザーのメッセージを保存するために使用する状態変数を定義 */
  const [messageValue, setMessageValue] = useState("");
  /* すべてのwavesを保存する状態変数を定義 */
  const [allWaves, setAllWaves] = useState([]);
  console.log("currentAccount: ", currentAccount);
  const [loader, setLoader] = useState(false)
  const [totalWaves, setTotalWaves] = useState();
  const [winAlert, setWinAlert] = useState(false);
  const [loseAlert, setLoseAlert] = useState(false);
  /* デプロイされたコントラクトのアドレスを保持する変数を作成 */
  const contractAddress = "0x8a4a6D986884ea202C68C345d221a4e45c4fd2dD";
  //const contractAddress = "0x1dA6C423D854802499b660f9Ba17C356bbc8fBA9";
  /* コントラクトからすべてのwavesを取得するメソッドを作成 */
  /* ABIの内容を参照する変数を作成 */
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /* コントラクトからgetAllWavesメソッドを呼び出す */
        const waves = await wavePortalContract.getAllWaves();
        /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
        /* React Stateにデータを格納する */
        setAllWaves(wavesCleaned);
        setTotalWaves(wavesCleaned.length);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };


  /**
   * `emit`されたイベントをフロントエンドに反映させる
   */
  useEffect( () => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    /* NewWaveイベントがコントラクトから発信されたときに、情報をを受け取ります */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      console.log("wavePortalContract");
      console.log(wavePortalContract);

      wavePortalContract.on("NewWave", onNewWave);
    }
    /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  /* window.ethereumにアクセスできることを確認する関数を実装 */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };
  /* connectWalletメソッドを実装 */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  /* waveの回数をカウントする関数を実装 */
  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        /* ABIを参照 */
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(count.toNumber());
        //コントラクトの残高を取得
        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance:",
          ethers.utils.formatEther(contractBalance)
        );
        /* コントラクトに👋（wave）を書き込む */
        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 300000,
        });
        setLoader(true)
        console.log("provider.getCode(address)");
        console.log(provider.getCode(contractAddress));
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setLoader(false);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(count.toNumber());
        //ユーザーが ETH を獲得したか検証
        let contractBalance_post = await provider.getBalance(
          wavePortalContract.address
        );
        /* コントラクトの残高が減っていることを確認 */
        if (contractBalance_post < contractBalance) {
          /* 減っていたら下記を出力 */
          console.log("User won ETH!");
          setWinAlert(true)
        } else {
          console.log("User didn't win ETH.");
          setLoseAlert(true);
        }
        console.log(
          "Contract balance after wave:",
          ethers.utils.formatEther(contractBalance_post)
        );
      } else {
        console.log("Ethereum object doesn't exist!");
        setLoader(false);
        alert("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setLoader(false);
      alert("Transaction failed.");
    }
  };

  /* WEBページがロードされたときにcheckIfWalletIsConnected()を実行 */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  //win lose alert
  useEffect(() => {
    setTimeout(() => {
      setWinAlert(false)
      setLoseAlert(false)
    }, 5000);
  }, [winAlert, loseAlert]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
          WELCOME!
        </div>
        <div className="bio">
          Connect your ETH wallet and wave at me!!
          <span role="img" aria-label="shine">
            ✨
          </span>
        </div>
        <br />
        {winAlert && (
          <div class="alert alert-success shadow-lg mb-5 text-yellow-200">
            <div>
              <BsEmojiWinkFill />
              <span>Conglaturation!! You Win 0.001ETH!</span>
            </div>
          </div>
        )}
        {loseAlert && (
          <div class="alert alert-error shadow-lg mb-5 text-yellow-200">
            <div>
              <FaGrinTongueWink />
              <span>Oops!! You lose...</span>
            </div>
          </div>
        )}
        {currentAccount && (
          <>
            <p>total wave : {totalWaves}</p>
          </>
        )}
        {/* ウォレットコネクトのボタンを実装 */}
        <div className="flex flex-col gap-3 mb-5">
          {!currentAccount && (
            <button
              className="waveButton btn btn-active"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
          {currentAccount && (
            <>
              <p>Your wallet: {currentAccount}</p>
              <div className="alert shadow-lg">
                <div>
                  <BsCheck2Circle />
                  <span>Wallet connected.</span>
                </div>
              </div>
            </>
          )}
          {/* メッセージボックスを実装*/}
          {currentAccount && (
            <textarea
              name="messageArea"
              placeholder="メッセージはこちら"
              type="text"
              id="message"
              className="textarea textarea-bordered"
              value={messageValue}
              onChange={(e) => setMessageValue(e.target.value)}
            />
          )}
          {/* waveボタンにwave関数を連動 */}
          {currentAccount && (
            <button className="waveButton btn btn-active" onClick={wave}>
              Wave at Me
            </button>
          )}
          {loader && (
            <div className="flex justify-center items-center">
              <Loader />
            </div>
          )}
        </div>
        {/* 履歴を表示する */}
        <div className="flex flex-col gap-4">
          {currentAccount &&
            allWaves
              .slice(0)
              .reverse()
              .map((wave, index) => {
                return (
                  <div key={index}>
                    <Card
                      index={index}
                      address={wave.address}
                      time={wave.timestamp.toString()}
                      message={wave.message}
                    />
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
export default App;