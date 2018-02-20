/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

require('../../functional.js');
const MasterWAMPServer = require('wamp-socket-cluster/MasterWAMPServer');
const connect = require('../../../../api/ws/rpc/connect');
const failureCodes = require('../../../../api/ws/rpc/failure_codes');
const wsRPC = require('../../../../api/ws/rpc/ws_rpc').wsRPC;
const transport = require('../../../../api/ws/transport');
const System = require('../../../../modules/system');
const WSServer = require('../../../common/ws/server_master');

describe('RPC Client', () => {
	const validWSServerIp = '127.0.0.1';
	const validWSServerPort = 5000;
	let validClientRPCStub;
	let socketClusterMock;
	let connectionClosedErrorCode;
	let connectionClosedErrorDescription;

	function reconnect(ip = validWSServerIp, wsPort = validWSServerPort) {
		validClientRPCStub = connect({ ip, wsPort }).rpc;
	}

	before(() => {
		socketClusterMock = {
			on: sinonSandbox.spy(),
		};
		wsRPC.setServer(new MasterWAMPServer(socketClusterMock));
		// Register RPC
		const transportModuleMock = { internal: {}, shared: {} };
		transport(transportModuleMock);
		// Now ClientRPCStub should contain all methods names
		reconnect();
	});

	describe('should contain remote procedure', () => {
		it('updatePeer', () => {
			expect(validClientRPCStub).to.have.property('updatePeer');
		});

		it('blocksCommon', () => {
			expect(validClientRPCStub).to.have.property('blocksCommon');
		});

		it('height', () => {
			expect(validClientRPCStub).to.have.property('height');
		});

		it('getTransactions', () => {
			expect(validClientRPCStub).to.have.property('getTransactions');
		});

		it('getSignatures', () => {
			expect(validClientRPCStub).to.have.property('getSignatures');
		});

		it('status', () => {
			expect(validClientRPCStub).to.have.property('list');
		});

		it('postBlock', () => {
			expect(validClientRPCStub).to.have.property('postBlock');
		});

		it('postSignatures', () => {
			expect(validClientRPCStub).to.have.property('postSignatures');
		});

		it('postTransactions', () => {
			expect(validClientRPCStub).to.have.property('postTransactions');
		});
	});

	it('should not contain randomProcedure', () => {
		expect(validClientRPCStub).not.to.have.property('randomProcedure');
	});

	describe('RPC call', () => {
		let validHeaders;

		beforeEach(() => {
			validHeaders = WSServer.generatePeerHeaders();
			System.setHeaders(validHeaders);
			reconnect();
		});

		describe('with valid headers', () => {
			it('should call a RPC callback with response', done => {
				validClientRPCStub.status((err, response) => {
					expect(response).not.to.be.empty;
					done();
				});
			});

			it('should call a RPC callback without an error as null', done => {
				validClientRPCStub.status(err => {
					expect(err).to.be.null;
					done();
				});
			});
		});

		describe('with invalid headers', () => {
			describe('without port', () => {
				beforeEach(() => {
					delete validHeaders.wsPort;
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			// ToDo: Throws "Unable to find resolving function for procedure status with signature ..." error
			describe('with valid port as string', () => {
				beforeEach(() => {
					validHeaders.wsPort = validHeaders.wsPort.toString();
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = null', done => {
					validClientRPCStub.status(err => {
						expect(err).to.be.null;
						done();
					});
				});

				it('should close client connection with description = "Expected type integer but found type not-a-number"', done => {
					validClientRPCStub.status(() => {
						expect(connectionClosedErrorCode).equal(
							failureCodes.INVALID_HEADERS
						);
						expect(connectionClosedErrorDescription).equal(
							'Expected type integer but found type not-a-number'
						);
						done();
					});
				});
			});

			describe('with too short nonce', () => {
				beforeEach(() => {
					validHeaders.nonce = 'TOO_SHORT';
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			describe('with too short nonce', () => {
				beforeEach(() => {
					validHeaders.nonce = 'TOO_SHORT';
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			// it('with too short nonce should close WS connection with INVALID_HEADERS error', done => {
			// 	validHeaders.nonce = 'TOO_SHORT';
			// 	System.setHeaders(validHeaders);
			// 	validClientRPCStub.status(err => {
			// 		expect(err)
			// 			.to.have.property('code')
			// 			.equal(failureCodes.INVALID_HEADERS);
			// 		expect(err)
			// 			.to.have.property('description')
			// 			.equal('nonce: String is too short (9 chars), minimum 16');
			// 		done();
			// 	});
			// });

			describe('with too long nonce', () => {
				beforeEach(() => {
					validHeaders.nonce = 'NONCE_LONGER_THAN_16_CHARS';
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			// it('with too long nonce should close WS connection with INVALID_HEADERS error', done => {
			// 	validHeaders.nonce = 'NONCE_LONGER_THAN_16_CHARS';
			// 	System.setHeaders(validHeaders);
			// 	validClientRPCStub.status(err => {
			// 		expect(err)
			// 			.to.have.property('code')
			// 			.equal(failureCodes.INVALID_HEADERS);
			// 		expect(err)
			// 			.to.have.property('description')
			// 			.equal('nonce: String is too long (26 chars), maximum 16');
			// 		done();
			// 	});
			// });

			describe('without nonce', () => {
				beforeEach(() => {
					delete validHeaders.nonce;
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			describe('without nethash', () => {
				beforeEach(() => {
					delete validHeaders.nethash;
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			describe('without height', () => {
				beforeEach(() => {
					delete validHeaders.height;
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});

			describe('without version', () => {
				beforeEach(() => {
					delete validHeaders.version;
					System.setHeaders(validHeaders);
					reconnect();
				});

				it('should call rpc.status with err = "RPC response timeout exceeded"', done => {
					validClientRPCStub.status(err => {
						expect(err).equal('RPC response timeout exceeded');
						done();
					});
				});
			});
		});
	});
});
