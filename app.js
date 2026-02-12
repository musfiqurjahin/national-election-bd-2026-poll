const loadFirebase = () => {
            return new Promise((resolve) => {
                const scripts = [
                    'https://www.gstatic.com/firebasejs/9.0.2/firebase-app-compat.js',
                    'https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore-compat.js'
                ];

                let loaded = 0;
                scripts.forEach(src => {
                    if (!document.querySelector(`script[src="${src}"]`)) {
                        const scriptTag = document.createElement('script');
                        scriptTag.src = src;
                        scriptTag.onload = () => {
                            loaded++;
                            if (loaded === scripts.length) resolve();
                        };
                        document.head.appendChild(scriptTag);
                    } else {
                        loaded++;
                        if (loaded === scripts.length) resolve();
                    }
                });
            });
        };

        const initializeFirebase = () => {
            const firebaseConfig = {
                apiKey: "AIzaSyBnivFUB5BAYKQGuujUrwj3GlRPGHG9RrQ",
                authDomain: "musfiqurj4h1n.firebaseapp.com",
                projectId: "musfiqurj4h1n",
                storageBucket: "musfiqurj4h1n.firebasestorage.app",
                messagingSenderId: "91301970362",
                appId: "1:91301970362:web:af236e4e8fa2400cb05d83",
                measurementId: "G-X3G6ZFXCBR"
            };

            const app = firebase.initializeApp(firebaseConfig);
            return firebase.firestore();
        };

        // ফেয়ার পোল সিস্টেম - গণভোটে নতুন অপশন: "নো ভোট"
        class FairBanglaPollSystem {
            constructor() {
                this.pollId = 'banglaPoll2026';
                
                // রাজনৈতিক দল
                this.politicalParties = [
                    { 
                        id: 'party1', 
                        name: 'বাংলাদেশ জামায়াতে ইসলামী', 
                        symbol: '⚖️',
                        color: '#2e7d32'
                    },
                    { 
                        id: 'party2', 
                        name: 'বাংলাদেশ ন্যাশনালিস্ট পার্টি (বিএনপি)', 
                        symbol: '🌾',
                        color: '#b45309'
                    },
                    { 
                        id: 'party3', 
                        name: 'ন্যাশনাল সিটিজেন পার্টি (এনসিপি)', 
                        symbol: 'NCP',
                        color: '#1e4b8a'
                    },
                    { 
                        id: 'party4', 
                        name: 'জাতীয় পার্টি (এরশাদ)', 
                        symbol: '🌽',
                        color: '#b45309'
                    },
                    { 
                        id: 'party5', 
                        name: 'নো ভোট', 
                        symbol: '▶',
                        color: '#6b4f8c'
                    }
                ];
                
                // গণভোটের অপশন - তিনটি: হ্যাঁ, না, নো ভোট
                this.referendumOptions = [
                    { id: 'refYes', name: 'হ্যাঁ', icon: '✅', value: 'হ্যাঁ' },
                    { id: 'refNo', name: 'না', icon: '❌', value: 'না' },
                    { id: 'refNoVote', name: 'নো ভোট', icon: '▶', value: 'নো ভোট' }  // নতুন অপশন
                ];
                
                this.db = null;
                this.pollRef = null;
                this.referendumRef = null;
                this.userVote = null;
                this.userReferendumVote = null;
                this.hasVoted = false;
                this.hasVotedReferendum = false;
                
                this.init();
            }

            async init() {
                await loadFirebase();
                this.db = initializeFirebase();
                this.pollRef = this.db.collection('banglaPolls').doc(this.pollId);
                this.referendumRef = this.db.collection('banglaReferendum').doc('referendum2026');
                
                this.createPollUI();
                await this.loadInitialData();
                this.setupRealtimeListener();
                this.checkUserVote(); 
            }

            createPollUI() {
                const container = document.getElementById('poll-root');
                container.innerHTML = `
                    <div class="poll-header">
                        <div class="poll-title">
                            <i class="fas fa-square-poll-vertical"></i>
                            <h1>আপনি কিসে ভোট দিলেন?</h1>
                        </div>
                        <div class="total-votes">
                            <i class="fas fa-users"></i>
                            <span>মোট:</span>
                            <span id="totalCount" class="total-number">০</span>
                            <span id="voteSpinner" class="spinner" style="display: none;"></span>
                        </div>
                    </div>

                    <div id="pollOptions" class="poll-options-grid">
                        ${this.generatePartyOptionsHTML()}
                    </div>

                    <div class="referendum-section">
                        <div class="referendum-header">
                            <i class="fas fa-check-circle"></i>
                            <h2>গণভোটে?</h2>
                        </div>
                        <div id="referendumOptions" class="referendum-options">
                            ${this.generateReferendumHTML()}
                        </div>
                    </div>

                    <div id="voteMessage" class="vote-message"></div>
                    
                    <div class="footer-actions">
                        <div class="last-updated">
                            <i class="fas fa-clock"></i>
                            <span id="lastUpdated">আপডেট হচ্ছে...</span>
                        </div>
                    </div>
                `;

                setTimeout(() => {
                    this.attachListeners();
                }, 0);
            }

            generatePartyOptionsHTML() {
                return this.politicalParties.map((party, index) => `
                    <div id="option-${party.id}" class="poll-option" data-option-id="${party.id}">
                        <div class="option-row">
                            <div class="party-symbol" style="border-color: ${party.color}30;">
                                <span style="color: ${party.color};">${party.symbol}</span>
                            </div>
                            <div class="party-info">
                                <div class="party-name">
                                    ${party.name}
                                    <span id="voteBadge-${party.id}" class="vote-badge" style="display: none;">
                                        <i class="fas fa-check-circle"></i> আপনার ভোট
                                    </span>
                                </div>
                            </div>
                            <span id="count-${party.id}" class="vote-count">
                                <i class="fas fa-vote-yea"></i>
                                <span id="countValue-${party.id}">০</span>
                            </span>
                        </div>
                        <div class="progress-section">
                            <div class="progress-bar-bg">
                                <div id="progress-${party.id}" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, ${party.color}, ${party.color}dd);"></div>
                            </div>
                            <span id="percentage-${party.id}" class="percentage">০%</span>
                        </div>
                        <div id="increment-${party.id}" style="position: relative;"></div>
                    </div>
                `).join('');
            }

            generateReferendumHTML() {
                return this.referendumOptions.map(opt => `
                    <div id="ref-${opt.id}" class="referendum-option" data-ref-id="${opt.id}">
                        <div class="ref-label">
                            <span>${opt.icon}</span>
                            <span>${opt.name}</span>
                        </div>
                        <span id="refCount-${opt.id}" class="ref-count">
                            <span id="refCountValue-${opt.id}">০</span>
                        </span>
                        <div id="refIncrement-${opt.id}" style="position: relative;"></div>
                    </div>
                `).join('');
            }

            attachListeners() {
                this.politicalParties.forEach(party => {
                    const element = document.getElementById(`option-${party.id}`);
                    if (element) {
                        element.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!this.hasVoted) {
                                this.castVote(party.id);
                            } else {
                                this.showMessage('আপনি ইতিমধ্যে ভোট দিয়েছেন। ফেয়ার পোল: একজন ভোটার একবারই ভোট দিতে পারেন।', 'warning');
                            }
                        });
                    }
                });

                this.referendumOptions.forEach(opt => {
                    const element = document.getElementById(`ref-${opt.id}`);
                    if (element) {
                        element.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!this.hasVotedReferendum) {
                                this.castReferendumVote(opt.id);
                            } else {
                                this.showMessage('গণভোটে আপনি ইতিমধ্যে ভোট দিয়েছেন।', 'warning');
                            }
                        });
                    }
                });
            }

            async loadInitialData() {
                try {
                    const pollDoc = await this.pollRef.get();
                    if (!pollDoc.exists) {
                        const initialVotes = {};
                        this.politicalParties.forEach(party => { initialVotes[party.id] = 0; });
                        
                        await this.pollRef.set({
                            votes: initialVotes,
                            totalVotes: 0,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    const refDoc = await this.referendumRef.get();
                    if (!refDoc.exists) {
                        // আপডেট: তিনটি অপশনের জন্য প্রাথমিক মান 0
                        await this.referendumRef.set({
                            votes: { refYes: 0, refNo: 0, refNoVote: 0 },
                            totalVotes: 0,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // যদি ডকুমেন্ট আগে থেকে থাকে কিন্তু refNoVote ফিল্ড না থাকে, তাহলে সেট করে দিচ্ছি
                        const data = refDoc.data();
                        if (data.votes && data.votes.refNoVote === undefined) {
                            await this.referendumRef.update({
                                'votes.refNoVote': 0
                            });
                        }
                    }
                } catch (error) {
                    console.error('ডাটা লোড করতে সমস্যা:', error);
                }
            }

            setupRealtimeListener() {
                this.pollRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        this.updatePartyUI(data);
                    }
                }, (error) => {
                    console.error('রিয়েল-টাইম আপডেটে সমস্যা:', error);
                });

                this.referendumRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        this.updateReferendumUI(data);
                    }
                });
            }

            updatePartyUI(data) {
                const votes = data.votes || {};
                const total = data.totalVotes || 0;
                
                document.getElementById('totalCount').textContent = this.bnNumber(total);
                
                this.politicalParties.forEach(party => {
                    const count = votes[party.id] || 0;
                    const countElement = document.getElementById(`countValue-${party.id}`);
                    const oldCount = parseInt(this.enNumber(countElement.textContent)) || 0;
                    
                    if (count > oldCount) {
                        this.showIncrementAnimation(`option-${party.id}`, count - oldCount);
                    }
                    
                    countElement.textContent = this.bnNumber(count);
                    
                    const percentage = total > 0 ? (count / total * 100) : 0;
                    document.getElementById(`progress-${party.id}`).style.width = `${percentage}%`;
                    document.getElementById(`percentage-${party.id}`).textContent = this.bnNumber(Math.round(percentage)) + '%';
                });
                
                document.getElementById('lastUpdated').textContent = 'এইমাত্র আপডেট';
            }

            updateReferendumUI(data) {
                const votes = data.votes || {};
                
                this.referendumOptions.forEach(opt => {
                    const count = votes[opt.id] || 0;
                    const countElement = document.getElementById(`refCountValue-${opt.id}`);
                    if (countElement) {
                        countElement.textContent = this.bnNumber(count);
                    }
                });
            }

            async castVote(partyId) {
                if (this.hasVoted) return;

                try {
                    document.getElementById('voteSpinner').style.display = 'inline-block';
                    
                    await this.pollRef.update({
                        [`votes.${partyId}`]: firebase.firestore.FieldValue.increment(1),
                        totalVotes: firebase.firestore.FieldValue.increment(1)
                    });
                    
                    localStorage.setItem(`poll_${this.pollId}_vote`, partyId);
                    
                    this.userVote = partyId;
                    this.hasVoted = true;
                    
                    this.highlightVotedOption(partyId);
                    
                    const partyName = this.politicalParties.find(p => p.id === partyId)?.name;
                    this.showMessage(`✅ আপনি ${partyName}-এ ভোট দিয়েছেন। ধন্যবাদ!`, 'success');
                    
                } catch (error) {
                    console.error('ভোট দিতে সমস্যা:', error);
                    this.showMessage('ভোট দিতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।', 'warning');
                } finally {
                    document.getElementById('voteSpinner').style.display = 'none';
                }
            }

            async castReferendumVote(refId) {
                if (this.hasVotedReferendum) return;

                try {
                    await this.referendumRef.update({
                        [`votes.${refId}`]: firebase.firestore.FieldValue.increment(1),
                        totalVotes: firebase.firestore.FieldValue.increment(1)
                    });
                    
                    localStorage.setItem(`referendum_${this.pollId}_vote`, refId);
                    
                    this.userReferendumVote = refId;
                    this.hasVotedReferendum = true;
                    
                    this.highlightReferendumVote(refId);
                    
                    const refName = this.referendumOptions.find(r => r.id === refId)?.name;
                    this.showMessage(`✅ গণভোটে "${refName}" ভোট দিয়েছেন`, 'success');
                    
                } catch (error) {
                    console.error('গণভোটে ভোট দিতে সমস্যা:', error);
                }
            }

            highlightVotedOption(partyId) {
                this.politicalParties.forEach(party => {
                    const element = document.getElementById(`option-${party.id}`);
                    const badge = document.getElementById(`voteBadge-${party.id}`);
                    if (element) {
                        element.classList.remove('voted');
                        element.classList.add('disabled');
                        if (badge) badge.style.display = 'none';
                        
                        if (party.id === partyId) {
                            element.classList.add('voted');
                            if (badge) badge.style.display = 'inline-flex';
                        }
                    }
                });
            }

            highlightReferendumVote(refId) {
                this.referendumOptions.forEach(opt => {
                    const element = document.getElementById(`ref-${opt.id}`);
                    if (element) {
                        element.classList.remove('voted');
                        element.classList.add('disabled');
                        if (opt.id === refId) {
                            element.classList.add('voted');
                        }
                    }
                });
            }

            showIncrementAnimation(elementId, delta) {
                const element = document.getElementById(elementId);
                if (!element) return;

                const anim = document.createElement('span');
                anim.className = 'increment-anim';
                anim.innerHTML = `<i class="fas fa-arrow-up"></i> +${this.bnNumber(delta)}`;
                element.appendChild(anim);

                setTimeout(() => anim.remove(), 2500);
            }

            showMessage(message, type) {
                const messageElement = document.getElementById('voteMessage');
                messageElement.textContent = message;
                messageElement.className = `vote-message ${type}`;
                
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 4000);
            }

            checkUserVote() {
                const partyVote = localStorage.getItem(`poll_${this.pollId}_vote`);
                const refVote = localStorage.getItem(`referendum_${this.pollId}_vote`);
                
                if (partyVote) {
                    this.userVote = partyVote;
                    this.hasVoted = true;
                    this.highlightVotedOption(partyVote);
                }
                
                if (refVote) {
                    this.userReferendumVote = refVote;
                    this.hasVotedReferendum = true;
                    this.highlightReferendumVote(refVote);
                }
            }

            bnNumber(num) {
                const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
                return num.toString().replace(/\d/g, x => bnDigits[x]);
            }

            enNumber(bnStr) {
                const bnDigits = '০১২৩৪৫৬৭৮৯';
                const enDigits = '0123456789';
                return bnStr.replace(/[০-৯]/g, d => enDigits[bnDigits.indexOf(d)]);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            new FairBanglaPollSystem();
        });