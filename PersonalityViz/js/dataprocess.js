function loadUserTwitter(userid, callback) {

	/*--------Begin to retrieve twitter data-------------*/

	var url = "https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&user_id="+userid+"&count=10&callback=?";//30317764-->liang's, 32475697->other test
    var url_to_cached="http://j3.almaden.ibm.com:8080/BrandyInterface/twitter/getUserTweets?limit=10&user_id="+userid;
	//$.getJSON("data/15448751.json", function(twitters) {
	$.getJSON(url_to_cached, function(twitters) {
		//add tweets
		var htm_usertweets = '<div class="tweet"><span class="text">TWEET_TEXT </span><span class="time">AGO</span> </div>';
		
		$('#twitter').empty();
		for (var i = 0; i < twitters.length; i++) {
			var user = twitters[i].user;
			
			CURRENT_USER=user;
			var status = Ify.clean(twitters[i].text);

			$('#twitter').append(htm_usertweets.replace('TWEET_TEXT', status).replace('AGO', '<a href="http://twitter.com/' + user.screen_name + '/statuses/' + twitters[i].id_str + '">' + relative_time(twitters[i].created_at) + '</a>'));

		}

		//add photo
		//alert(user.profile_image_url);
		
		var largeImgUrl = user.profile_image_url, flagstring = "_normal.", idx = largeImgUrl.indexOf(flagstring);
		largeImgUrl = largeImgUrl.substring(0, idx) + '.' + largeImgUrl.substring(idx + flagstring.length, largeImgUrl.length);
		CURRENT_USER.largeImgUrl=largeImgUrl;
		//alert(largeImgUrl);
		
		var htm_user_photo = '<a href="http://twitter.com/' + user.screen_name + '" class="tweet-url profile-pic-large"><div class="crop_avatar_large"><img src="' + largeImgUrl + '"></div><span class="icon"></span></a>';
		$('#user_photo').empty();
		$('#user_photo').append(htm_user_photo);

		//add bio
		var htm_user_bio = '<p class="fn-above"> USER_NAME </p><p class="sn"> USER_TWITTER_ACCOUNT ' + '</p><p class="location"> USER_LOCATION </p><p class="location"/> 	<ul class="user_stats">	<li class="first"><span class="stat">' + 'USER_TWEETS_COUNT </span><span class="type">tweets</span></li><li><span class="stat"> USER_FRIENDS_COUNT' + '</span><span class="type">following</span></li><li class="last"><span class="stat"> USER_FOLLOWERS_COUNT </span>' + '<span class="type">followers</span></li></ul>';

		var user_twitter_account = '<a href="http://twitter.com/' + user.screen_name + '" class="screen_name tweet-url screen-name"><span class="at_symbol">@</span>' + user.screen_name + '</a>';
		$('#user_bio').empty();
		$('#user_bio').append(htm_user_bio.replace('USER_NAME', user.name).replace('USER_TWITTER_ACCOUNT', user_twitter_account).replace('USER_LOCATION', user.location).replace('USER_TWEETS_COUNT', user.statuses_count).replace('USER_FRIENDS_COUNT', user.friends_count).replace('USER_FOLLOWERS_COUNT', user.followers_count));

		//add description
		var htm_description_inner = '<p> <strong>Web:</strong> USER_WEBLINK </p><p><strong>Description:</strong> USER_DESCRIPTION</p>';
		var user_weblink = '<a href="' + user.url + '" rel="nofollow" target="_blank">' + user.url + '</a>'
		$('#description_inner').empty();
		$('#description_inner').append(htm_description_inner.replace('USER_WEBLINK', user_weblink).replace('USER_DESCRIPTION', user.description));
		
		if (callback && typeof(callback) === "function") {  
       		callback(twitters); 
    	} 
		
	});
	//getJSON


}
	function relative_time(time_value) {
		var values = time_value.split(" ");
		time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
		var parsed_date = Date.parse(time_value);
		var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
		var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
		delta = delta + (relative_to.getTimezoneOffset() * 60);

		if (delta < 60) {
			return 'less than a minute ago';
		} else if (delta < 120) {
			return 'about a minute ago';
		} else if (delta < (60 * 60)) {
			return (parseInt(delta / 60)).toString() + ' minutes ago';
		} else if (delta < (120 * 60)) {
			return 'about an hour ago';
		} else if (delta < (24 * 60 * 60)) {
			return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
		} else if (delta < (48 * 60 * 60)) {
			return '1 day ago';
		} else if (parseInt(delta / 86400) <= 31) {
			return (parseInt(delta / 86400)).toString() + ' days ago';
		} else if (parseInt(delta / 86400) > 30) {
			return values[0] + ", " + values[1] + " " + values[2];
		}
	}//relative_time

	/**
	 * The Twitalinkahashifyer!
	 * http://www.dustindiaz.com/basement/ify.html
	 * Eg:
	 * Ify.clean('your tweet text');
	 */
	Ify = {
		link : function(tweet) {
			return tweet.replace(/\b(((https*\:\/\/)|www\.)[^\"\']+?)(([!?,.\)]+)?(\s|$))/g, function(link, m1, m2, m3, m4) {
				var http = m2.match(/w/) ? 'http://' : '';
				return '<a class="twtr-hyperlink" target="_blank" href="' + http + m1 + '">' + ((m1.length > 25) ? m1.substr(0, 24) + '...' : m1) + '</a>' + m4;
			});
		},

		at : function(tweet) {
			return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20})/g, function(m, username) {
				return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/intent/user?screen_name=' + username + '">@' + username + '</a>';
			});
		},

		list : function(tweet) {
			return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20}\/\w+)/g, function(m, userlist) {
				return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/' + userlist + '">@' + userlist + '</a>';
			});
		},

		hash : function(tweet) {
			return tweet.replace(/(^|\s+)#(\w+)/gi, function(m, before, hash) {
				return before + '<a target="_blank" class="twtr-hashtag" href="http://twitter.com/search?q=%23' + hash + '">#' + hash + '</a>';
			});
		},

		clean : function(tweet) {
			return this.hash(this.at(this.list(this.link(tweet))));
		}
	}// ify
	

function lookUpUser(userid, callback) {
	
	var url = "https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&user_id="+userid+"&count=10&callback=?"
//	$.getJSON("data/32475697.json", function(twitter) {
$.getJSON(url, function(twitter) {
		if(twitter.length>0){
			var user = twitter[0].user;
			//add large photo url
			var largeImgUrl = user.profile_image_url, flagstring = "_normal.", idx = largeImgUrl.indexOf(flagstring);
			largeImgUrl = largeImgUrl.substring(0, idx) + '.' + largeImgUrl.substring(idx + flagstring.length, largeImgUrl.length);

			user.largeImgUrl=largeImgUrl;
			if (callback && typeof(callback) === "function") {  
       		callback(user); 
    	} 
		};
	});

}


function loadCurrentPersonality(user_id, callback){
	
	//var q_personality='/query?q={"loc":{"user_id":'+userid+'}, "cnt":"Personality"}';//'data/traits/personality.json';//
	var q_personality='http://j3.almaden.ibm.com:8080/BrandyInterface/twitter/lookupUser?user_id='+user_id;
	
	$.getJSON(q_personality, function(data) {
		if(data.children!=null){
			var personality=new Object();
				personality.name="Personality";
				personality.id="root"; 		
				personality.userid=data.user_id;
				personality.children=data.children;
				personality.start_time=-1;
				personality.end_time=-1;				
			if (callback && typeof(callback) === "function") {  
       		callback(data.children); 
    	} 
		};
	});	
}

function loadPersonalityOverTime(user_id, category, start, end, callback){
	
	//var q_p_overtime='http://localhost:8080/BrandyInterface/twitter/getPersonalityOverTime?user_id='+user_id+'&start='+start+'&end='+end;
	var	q_p_overtime='data/personality_overtime.json';
	if (CURRENT_PERSONALITY_OVER_TIME!=null) 
		if (user_id==CURRENT_PERSONALITY_OVER_TIME.user_id 
			&& start==CURRENT_PERSONALITY_OVER_TIME.start 
			&& end==CURRENT_PERSONALITY_OVER_TIME.end)
			//use cache
			{
				if (callback && typeof(callback) === "function") {  
	       		callback(CURRENT_PERSONALITY_OVER_TIME.data.filter(categoryFilter)); 
	    		} 
	    	}
    	else
	    //new request 	
		$.getJSON(q_p_overtime, function(data) {
			if(data!=null){
				    CURRENT_PERSONALITY_OVER_TIME=new Object();
					CURRENT_PERSONALITY_OVER_TIME.user_id=user_id;
					CURRENT_PERSONALITY_OVER_TIME.start=start;
					CURRENT_PERSONALITY_OVER_TIME.end=end; 	 		
					CURRENT_PERSONALITY_OVER_TIME.data=data;
					
				if (callback && typeof(callback) === "function") {  
	       			callback(data.filter(categoryFilter)); 
	    		} 
			};
		});	
	
	function categoryFilter(element) {
  		return (element.parent == category);
	}
}

function loadPersonalityAnalyticsAtTime(user_id, start, end, callback){
	//var q_pa='http://localhost:8080/BrandyInterface/twitter/getPersonalityWithAnalyticsAtTime?user_id='+user_id+'&start='+start+'&end='+end;
	var q_pa='data/personality_analytics.json';
		
	if (CURRENT_PERSONALITY_AT_TIME!=null) 
		if (user_id==CURRENT_PERSONALITY_AT_TIME.user_id 
			&& start==CURRENT_PERSONALITY_AT_TIME.start 
			&& end==CURRENT_PERSONALITY_AT_TIME.end)
			//use cache
			{
				if (callback && typeof(callback) === "function") {  
	       		callback(CURRENT_PERSONALITY_AT_TIME.data); 
	    		} 
	    	}
    	else
	    //new request 	
		$.getJSON(q_pa, function(data) {
			if(data!=null){
				    CURRENT_PERSONALITY_AT_TIME=new Object();
					CURRENT_PERSONALITY_AT_TIME.user_id=user_id;
					CURRENT_PERSONALITY_AT_TIME.start=start;
					CURRENT_PERSONALITY_AT_TIME.end=end; 	 		
					CURRENT_PERSONALITY_AT_TIME.data=data;
					
				if (callback && typeof(callback) === "function") {  
	       			callback(data); 
	    		} 
			};
		});	
}
function loadTweetsAtTime(user_id, start, end, callback){
	//var q_pa='http://localhost:8080/BrandyInterface/twitter/getAllTweetsAtTime?user_id='+user_id+'&start='+start+'&end='+end;
	var q='data/tweets.json';
		
		if (CURRENT_ALL_TWEETS!=null) 
		if (user_id==CURRENT_ALL_TWEETS.user_id 
			&& start==CURRENT_ALL_TWEETS.start 
			&& end==CURRENT_ALL_TWEETS.end)
			//use cache
			{
				if (callback && typeof(callback) === "function") {  
	       		callback(CURRENT_ALL_TWEETS); 
	    		} 
	    	}
    	else
	    //new request 	
		$.getJSON(q, function(data) {
			if(data!=null){
				    CURRENT_ALL_TWEETS=new Object();
					CURRENT_ALL_TWEETS.user_id=user_id;
					CURRENT_ALL_TWEETS.start=start;
					CURRENT_ALL_TWEETS.end=end; 	 		
					CURRENT_ALL_TWEETS.tweets=data;
					
				if (callback && typeof(callback) === "function") {  
	       			callback(CURRENT_ALL_TWEETS); 
	    		} 
			};
		});	
	
}


function getIndexForFacet(big5, facetName) {
		
	if(big5=="Neuroticism"){
		if (facetName=="Anxiety") return 1;
		if (facetName=="Anger") return 2;
		if (facetName=="Depression") return 3;
		if (facetName=="Self-consciousness") return 4;
		if (facetName=="Immoderation") return 5;
		if (facetName=="Vulnerability") return 6;
	}
	
	if(big5=="Extraversion"){
		if (facetName=="Friendliness") return 1;
		if (facetName=="Gregariousness") return 2;
		if (facetName=="Assertiveness") return 3;
		if (facetName=="Activity level") return 4;
		if (facetName=="Excitement-seeking") return 5;
		if (facetName=="Cheerfulness") return 6;
	}
		
	if(big5=="Openness"){
		if (facetName=="Imagination") return 1;
		if (facetName=="Artistic interests") return 2;
		if (facetName=="Emotionality") return 3;
		if (facetName=="Adventurousness") return 4;
		if (facetName=="Intellect") return 5;
		if (facetName=="Liberalism") return 6;
	}
		
	if(big5=="Agreeableness"){
		if (facetName=="Trust") return 1;
		if (facetName=="Morality") return 2;
		if (facetName=="Altruism") return 3;
		if (facetName=="Cooperation") return 4;
		if (facetName=="Modesty") return 5;
		if (facetName=="Sympathy") return 6;
	}
	if(big5=="Conscientiousness"){
		if (facetName=="Self-efficacy") return 1;
		if (facetName=="Orderliness") return 2;
		if (facetName=="Dutifulness") return 3;
		if (facetName=="Achievement-striving") return 4;
		if (facetName=="Self-discipline") return 5;
		if (facetName=="Cautiousness") return 6;
	}
		
		return 1;
		
	}
