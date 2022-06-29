const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

// Web3 is the portal that allows us to talk to a node in a blockchain network
// the class has methods depending on what blockchain we working with for example web3.eth (for ethereum)
// in this case the provider is ganache with imitates ethereum in a local setup (i think)

// this test actually deploys it to ganache and tests if the functionality works. (Ganache is entirely local aka no etherscan vibes)

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
  it("deploys a contract", () => {
    // console.log(lottery.methods);
    assert.ok(lottery.options.address);
  });

  it("allows account to enter the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const players = await lottery.methods.getAllPlayers().call({
      from: accounts[0],
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows  multiple accounts to enter the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.02", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.02", "ether"),
    });

    const players = await lottery.methods.getAllPlayers().call({
      from: accounts[0],
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it("requires minimum amount of Eth to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 100,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call the pickWinner function", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("sends money to the winner and resets the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    // console.log(difference);
    assert(difference > web3.utils.toWei("1.8", "ether"));

    console.log(initialBalance);
    console.log(finalBalance);

    // players array is emptied out
  });

  it("resets the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("2", "ether"),
    });

    const initialPlayers = await lottery.methods.getAllPlayers().call({
      from: accounts[0],
    });

    console.log(initialPlayers);

    await lottery.methods.pickWinner().send({ from: accounts[0] });

    const players = await lottery.methods.getAllPlayers().call({
      from: accounts[0],
    });

    assert.equal(0, players.length);
    // console.log(players);
  });

  it('clears the balance of the contract to zero', async () => {
    await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei("2", "ether"),
      });
  
      await lottery.methods.enter().send({
        from: accounts[1],
        value: web3.utils.toWei("2", "ether"),
      });

    const initialBalance = await web3.eth.getBalance(lottery.options.address)

    console.log(initialBalance);

    await lottery.methods.pickWinner().send({ from: accounts[0] });

    const balance = await web3.eth.getBalance(lottery.options.address)

    assert.equal(0, balance)



  })
});
