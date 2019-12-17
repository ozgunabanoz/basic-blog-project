import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  async componentDidMount() {
    let res;
    let resData;

    try {
      res = await fetch('URL');

      if (res.status !== 200) {
        throw new Error('Failed to fetch user status.');
      }

      resData = await res.json();

      this.setState({ status: resData.status });
    } catch (err) {
      this.catchError(err);
    }

    this.loadPosts();
  }

  loadPosts = async direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }

    let page = this.state.postPage;

    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }

    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    let res;
    let resData;

    try {
      res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/feed/posts`
      );

      if (res.status !== 200) {
        throw new Error('Failed to fetch posts.');
      }

      resData = await res.json();

      this.setState({
        posts: resData.posts,
        totalPosts: resData.totalItems,
        postsLoading: false
      });
    } catch (err) {
      this.catchError(err);
    }
  };

  statusUpdateHandler = async event => {
    event.preventDefault();

    let res;
    let resData;

    try {
      res = await fetch('URL');

      if (res.status !== 200 && res.status !== 201) {
        throw new Error("Can't update status!");
      }

      resData = await res.json();

      console.log(resData);
    } catch (err) {
      this.catchError(err);
    }
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = {
        ...prevState.posts.find(p => p._id === postId)
      };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = async postData => {
    this.setState({
      editLoading: true
    });

    let url = `${process.env.REACT_APP_BACKEND_URL}/feed/post`;
    let method = 'POST';

    if (this.state.editPost) {
      url = 'URL';
    }

    let res;
    let resData;

    try {
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content
        })
      });

      if (res.status !== 200 && res.status !== 201) {
        throw new Error('Creating or editing a post failed!');
      }

      resData = await res.json();

      const post = {
        _id: resData.post._id,
        title: resData.post.title,
        content: resData.post.content,
        creator: resData.post.creator,
        createdAt: resData.post.createdAt
      };

      this.setState(prevState => {
        let updatedPosts = [...prevState.posts];

        if (prevState.editPost) {
          const postIndex = prevState.posts.findIndex(
            p => p._id === prevState.editPost._id
          );
          updatedPosts[postIndex] = post;
        } else if (prevState.posts.length < 2) {
          updatedPosts = prevState.posts.concat(post);
        }

        return {
          posts: updatedPosts,
          isEditing: false,
          editPost: null,
          editLoading: false
        };
      });
    } catch (err) {
      console.log(err);
      this.setState({
        isEditing: false,
        editPost: null,
        editLoading: false,
        error: err
      });
    }
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = async postId => {
    this.setState({ postsLoading: true });

    let res;
    let resData;

    try {
      res = await fetch('URL');

      if (res.status !== 200 && res.status !== 201) {
        throw new Error('Deleting a post failed!');
      }

      resData = await res.json();

      console.log(resData);

      this.setState(prevState => {
        const updatedPosts = prevState.posts.filter(
          p => p._id !== postId
        );
        return { posts: updatedPosts, postsLoading: false };
      });
    } catch (err) {
      console.log(err);
      this.setState({ postsLoading: false });
    }
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler
          error={this.state.error}
          onHandle={this.errorHandler}
        />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button
            mode="raised"
            design="accent"
            onClick={this.newPostHandler}
          >
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 &&
          !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString(
                    'en-US'
                  )}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(
                    this,
                    post._id
                  )}
                  onDelete={this.deletePostHandler.bind(
                    this,
                    post._id
                  )}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
